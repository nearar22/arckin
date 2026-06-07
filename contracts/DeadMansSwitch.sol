// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DeadMansSwitch
 * @notice An onchain inheritance vault built for Arc.
 *
 * An owner deposits a stablecoin (USDC on Arc) and configures a list of
 * beneficiaries with payout shares. As long as the owner periodically calls
 * `checkIn()` they are considered "alive" and keep full control of the funds.
 *
 * If the owner fails to check in within `checkInInterval`, the switch becomes
 * "tripped" and anyone can call `release()` to distribute the locked funds to
 * the beneficiaries according to their shares.
 *
 * Why Arc: USDC is the native, price-stable asset, so an inheritance keeps its
 * value over long lock periods, and sub-second finality with USDC gas keeps
 * check-ins and releases cheap and predictable.
 */
contract DeadMansSwitch is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev Total of all beneficiary shares for a switch must equal this.
    uint256 public constant TOTAL_SHARES = 10_000; // basis points (100.00%)

    struct Beneficiary {
        address account;
        uint256 shares; // in basis points, out of TOTAL_SHARES
    }

    struct Switch {
        address owner;
        IERC20 token;
        uint256 balance;
        uint256 checkInInterval; // seconds allowed between check-ins
        uint256 lastCheckIn; // timestamp of the most recent check-in
        bool released; // true once funds have been distributed
        Beneficiary[] beneficiaries;
    }

    /// @notice All switches, indexed by id.
    mapping(uint256 => Switch) private switches;

    /// @notice Number of switches created (also the id of the next switch).
    uint256 public switchCount;

    event SwitchCreated(
        uint256 indexed id,
        address indexed owner,
        address indexed token,
        uint256 amount,
        uint256 checkInInterval
    );
    event CheckedIn(uint256 indexed id, uint256 timestamp, uint256 deadline);
    event Deposited(uint256 indexed id, uint256 amount, uint256 newBalance);
    event Withdrawn(uint256 indexed id, address indexed to, uint256 amount);
    event BeneficiariesUpdated(uint256 indexed id);
    event Released(uint256 indexed id, uint256 totalAmount);
    event Paid(uint256 indexed id, address indexed beneficiary, uint256 amount);

    error NotOwner();
    error UnknownSwitch();
    error AlreadyReleased();
    error InvalidInterval();
    error NoBeneficiaries();
    error InvalidShares();
    error ZeroAddress();
    error SwitchStillActive();
    error SwitchNotActive();
    error NothingToRelease();
    error AmountTooHigh();

    modifier onlyOwner(uint256 id) {
        if (id >= switchCount) revert UnknownSwitch();
        if (switches[id].owner != msg.sender) revert NotOwner();
        _;
    }

    /**
     * @notice Create a new switch, lock `amount` of `token`, and set heirs.
     * @param token The stablecoin to lock (e.g. USDC on Arc).
     * @param amount Initial amount to deposit. Caller must approve first.
     * @param checkInInterval Max seconds allowed between check-ins.
     * @param beneficiaries Heirs and their shares (must sum to TOTAL_SHARES).
     * @return id The id of the newly created switch.
     */
    function createSwitch(
        IERC20 token,
        uint256 amount,
        uint256 checkInInterval,
        Beneficiary[] calldata beneficiaries
    ) external nonReentrant returns (uint256 id) {
        if (address(token) == address(0)) revert ZeroAddress();
        if (checkInInterval == 0) revert InvalidInterval();
        _validateBeneficiaries(beneficiaries);

        id = switchCount++;
        Switch storage s = switches[id];
        s.owner = msg.sender;
        s.token = token;
        s.checkInInterval = checkInInterval;
        s.lastCheckIn = block.timestamp;
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            s.beneficiaries.push(beneficiaries[i]);
        }

        if (amount > 0) {
            token.safeTransferFrom(msg.sender, address(this), amount);
            s.balance = amount;
        }

        emit SwitchCreated(id, msg.sender, address(token), amount, checkInInterval);
        emit CheckedIn(id, block.timestamp, block.timestamp + checkInInterval);
    }

    /// @notice Prove the owner is still active and reset the countdown.
    function checkIn(uint256 id) external onlyOwner(id) {
        Switch storage s = switches[id];
        if (s.released) revert AlreadyReleased();
        s.lastCheckIn = block.timestamp;
        emit CheckedIn(id, block.timestamp, block.timestamp + s.checkInInterval);
    }

    /// @notice Add more funds to an existing switch.
    function deposit(uint256 id, uint256 amount) external onlyOwner(id) nonReentrant {
        Switch storage s = switches[id];
        if (s.released) revert AlreadyReleased();
        s.token.safeTransferFrom(msg.sender, address(this), amount);
        s.balance += amount;
        // Depositing also counts as proof of life.
        s.lastCheckIn = block.timestamp;
        emit Deposited(id, amount, s.balance);
        emit CheckedIn(id, block.timestamp, block.timestamp + s.checkInInterval);
    }

    /// @notice Owner withdraws part or all of the locked funds while alive.
    function withdraw(uint256 id, uint256 amount) external onlyOwner(id) nonReentrant {
        Switch storage s = switches[id];
        if (s.released) revert AlreadyReleased();
        if (amount > s.balance) revert AmountTooHigh();
        s.balance -= amount;
        // Withdrawing also counts as proof of life.
        s.lastCheckIn = block.timestamp;
        s.token.safeTransfer(msg.sender, amount);
        emit Withdrawn(id, msg.sender, amount);
        emit CheckedIn(id, block.timestamp, block.timestamp + s.checkInInterval);
    }

    /// @notice Replace the beneficiary list (owner only, while alive).
    function updateBeneficiaries(uint256 id, Beneficiary[] calldata beneficiaries)
        external
        onlyOwner(id)
    {
        Switch storage s = switches[id];
        if (s.released) revert AlreadyReleased();
        _validateBeneficiaries(beneficiaries);

        delete s.beneficiaries;
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            s.beneficiaries.push(beneficiaries[i]);
        }
        // Updating config also counts as proof of life.
        s.lastCheckIn = block.timestamp;
        emit BeneficiariesUpdated(id);
        emit CheckedIn(id, block.timestamp, block.timestamp + s.checkInInterval);
    }

    /**
     * @notice Distribute funds to beneficiaries once the switch is tripped.
     * @dev Callable by anyone after the check-in deadline passes. This lets a
     *      beneficiary (or a keeper) trigger the inheritance without the owner.
     */
    function release(uint256 id) external nonReentrant {
        if (id >= switchCount) revert UnknownSwitch();
        Switch storage s = switches[id];
        if (s.released) revert AlreadyReleased();
        if (!_isTripped(s)) revert SwitchStillActive();
        if (s.balance == 0) revert NothingToRelease();

        s.released = true;
        uint256 total = s.balance;
        s.balance = 0;

        uint256 distributed;
        uint256 last = s.beneficiaries.length - 1;
        for (uint256 i = 0; i < s.beneficiaries.length; i++) {
            Beneficiary storage b = s.beneficiaries[i];
            // Give the remainder to the last heir to avoid rounding dust.
            uint256 part = (i == last)
                ? total - distributed
                : (total * b.shares) / TOTAL_SHARES;
            distributed += part;
            if (part > 0) {
                s.token.safeTransfer(b.account, part);
                emit Paid(id, b.account, part);
            }
        }

        emit Released(id, total);
    }

    // --------------------------------------------------------------------- //
    // Views
    // --------------------------------------------------------------------- //

    /// @notice Timestamp after which the switch can be released.
    function deadline(uint256 id) public view returns (uint256) {
        if (id >= switchCount) revert UnknownSwitch();
        Switch storage s = switches[id];
        return s.lastCheckIn + s.checkInInterval;
    }

    /// @notice Seconds left before the switch trips (0 if already tripped).
    function timeLeft(uint256 id) external view returns (uint256) {
        uint256 d = deadline(id);
        if (block.timestamp >= d) return 0;
        return d - block.timestamp;
    }

    /// @notice True if the owner missed the check-in window.
    function isTripped(uint256 id) external view returns (bool) {
        if (id >= switchCount) revert UnknownSwitch();
        return _isTripped(switches[id]);
    }

    /// @notice Read the core fields of a switch.
    function getSwitch(uint256 id)
        external
        view
        returns (
            address owner,
            address token,
            uint256 balance,
            uint256 checkInInterval,
            uint256 lastCheckIn,
            bool released
        )
    {
        if (id >= switchCount) revert UnknownSwitch();
        Switch storage s = switches[id];
        return (s.owner, address(s.token), s.balance, s.checkInInterval, s.lastCheckIn, s.released);
    }

    /// @notice Read the beneficiary list of a switch.
    function getBeneficiaries(uint256 id) external view returns (Beneficiary[] memory) {
        if (id >= switchCount) revert UnknownSwitch();
        return switches[id].beneficiaries;
    }

    // --------------------------------------------------------------------- //
    // Internal
    // --------------------------------------------------------------------- //

    function _isTripped(Switch storage s) private view returns (bool) {
        return block.timestamp > s.lastCheckIn + s.checkInInterval;
    }

    function _validateBeneficiaries(Beneficiary[] calldata beneficiaries) private pure {
        if (beneficiaries.length == 0) revert NoBeneficiaries();
        uint256 sum;
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            if (beneficiaries[i].account == address(0)) revert ZeroAddress();
            sum += beneficiaries[i].shares;
        }
        if (sum != TOTAL_SHARES) revert InvalidShares();
    }
}
