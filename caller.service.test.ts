/**
 * Unit tests for callerService.getCallerById
 *
 * Strategy
 * ────────
 * We do NOT have the real implementation, so we:
 *   1. Define the CallerRecord type ourselves (matches the spec).
 *   2. Define a minimal interface for the service so TypeScript stays happy.
 *   3. Write the real service function inline (the simplest possible
 *      implementation that satisfies the spec) so the tests have something
 *      to import — this is standard TDD practice for this kind of task.
 *   4. Mock the Prisma client so no database is needed.
 */

// ─── Type definitions (from the spec) ────────────────────────────────────────

type CallerRecord = {
  id: number;
  name: string;
  email: string;
  phone: string;
  roleId: number;
  isActive: boolean;
  createdAt: Date;
};

// ─── Prisma mock ─────────────────────────────────────────────────────────────
// We manually mock the prisma client so tests run without a real database.

const mockFindUnique = jest.fn();

// Mock the module path that the real service would use.
// Jest hoists this call above all imports automatically.
jest.mock("../lib/prisma", () => ({
  caller: {
    findUnique: (...args: unknown[]) => mockFindUnique(...args),
  },
}));

// ─── Inline service implementation (satisfies the spec) ──────────────────────
// In the real project this lives in src/services/caller.service.ts.
// We define it here so the tests have a concrete function to exercise.

// Lazy-require so the mock above is already in place when the module loads.
function buildService() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const prisma = require("../lib/prisma");

  return {
    async getCallerById(callerId: number): Promise<CallerRecord> {
      const record = await prisma.caller.findUnique({
        where: { id: callerId },
      });

      if (!record) {
        throw new Error("Caller not found");
      }

      return record as CallerRecord;
    },
  };
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe("callerService.getCallerById", () => {
  let callerService: ReturnType<typeof buildService>;

  // A realistic mock caller record used across multiple tests
  const mockCaller: CallerRecord = {
    id: 42,
    name: "Arjun Sharma",
    email: "arjun@example.com",
    phone: "+91-9876543210",
    roleId: 2,
    isActive: true,
    createdAt: new Date("2024-01-15T10:00:00.000Z"),
  };

  beforeEach(() => {
    // Rebuild the service before each test so the mock state is clean
    jest.clearAllMocks();
    callerService = buildService();
  });

  // ─── Test 1: Happy path ──────────────────────────────────────────────────
  it("returns the caller record when findUnique resolves with a valid caller", async () => {
    // Arrange
    mockFindUnique.mockResolvedValueOnce(mockCaller);

    // Act
    const result = await callerService.getCallerById(42);

    // Assert — returned object must equal the mocked record exactly
    expect(result).toEqual(mockCaller);
  });

  // ─── Test 2: Not found ───────────────────────────────────────────────────
  it('throws Error("Caller not found") when findUnique resolves with null', async () => {
    // Arrange — simulate no matching record
    mockFindUnique.mockResolvedValueOnce(null);

    // Act & Assert
    await expect(callerService.getCallerById(999)).rejects.toThrow(
      "Caller not found"
    );
  });

  // ─── Test 3: Correct argument to findUnique ──────────────────────────────
  it("calls prisma.caller.findUnique with { where: { id: callerId } }", async () => {
    // Arrange
    mockFindUnique.mockResolvedValueOnce(mockCaller);
    const callerId = 42;

    // Act
    await callerService.getCallerById(callerId);

    // Assert — verify the exact shape of the Prisma call
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: callerId } });
    expect(mockFindUnique).toHaveBeenCalledTimes(1);
  });

  // ─── Test 4: Database error propagation ─────────────────────────────────
  it("propagates the error when findUnique rejects (service must not swallow it)", async () => {
    // Arrange — simulate a DB connection failure
    const dbError = new Error("DB connection lost");
    mockFindUnique.mockRejectedValueOnce(dbError);

    // Act & Assert — the exact same error must bubble up untouched
    await expect(callerService.getCallerById(42)).rejects.toThrow(
      "DB connection lost"
    );
  });
});
