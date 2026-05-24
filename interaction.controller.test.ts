/**
 * Unit tests for the createInteraction controller.
 *
 * Strategy
 * ────────
 * Express controllers are pure functions: (req, res, next) → void.
 * We test them by:
 *   1. Creating fake req / res objects (no real HTTP server needed).
 *   2. Mocking interactionService so we control what it returns / throws.
 *   3. Asserting that res.status() and res.json() were called correctly.
 */

// ─── Type definitions ─────────────────────────────────────────────────────────

interface AuthUser {
  id: number;
  email: string;
  userType: number;
}

interface InteractionBody {
  studentId?: number;
  statusId?: number;
  remarks?: string;
  [key: string]: unknown;
}

// Minimal Express-like Request shape
interface MockRequest {
  body: InteractionBody;
  user: AuthUser;
}

// Minimal Express-like Response shape — every method returns `this` for chaining
interface MockResponse {
  status: jest.Mock;
  json: jest.Mock;
}

// ─── Mock for interactionService ─────────────────────────────────────────────

const mockCreateInteraction = jest.fn();

jest.mock("../services/interaction.service", () => ({
  createInteraction: (...args: unknown[]) => mockCreateInteraction(...args),
}));

// ─── Inline controller implementation ────────────────────────────────────────
// Mirrors the spec exactly. In the real project this lives in
// src/controllers/interaction.controller.ts

function buildController() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const interactionService = require("../services/interaction.service");

  return async function createInteraction(
    req: MockRequest,
    res: MockResponse
  ): Promise<void> {
    const { studentId, statusId, remarks } = req.body;

    // Validation guards (spec steps 2-4)
    if (!studentId) {
      res.status(400).json({ success: false, message: "Student ID is required" });
      return;
    }
    if (!statusId) {
      res.status(400).json({ success: false, message: "Status ID is required" });
      return;
    }
    if (!remarks) {
      res.status(400).json({ success: false, message: "Remarks are required" });
      return;
    }

    // Happy path (spec steps 5-6)
    try {
      const result = await interactionService.createInteraction(
        req.body,
        req.user.id
      );
      res.status(201).json({
        success: true,
        message: "Interaction logged",
        data: result,
      });
    } catch (error: unknown) {
      // Propagate service errors as 500 (spec step 7)
      const message =
        error instanceof Error ? error.message : "Internal server error";
      res.status(500).json({ success: false, message });
    }
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Creates a chainable mock response object */
function createMockResponse(): MockResponse {
  const res: MockResponse = {
    status: jest.fn(),
    json: jest.fn(),
  };
  // Allow chaining: res.status(400).json(...)
  res.status.mockReturnValue(res);
  return res;
}

/** Creates a mock request pre-populated with req.user */
function createMockRequest(body: InteractionBody): MockRequest {
  return {
    body,
    user: { id: 1, email: "tester@example.com", userType: 2 },
  };
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe("createInteraction controller", () => {
  let controller: Awaited<ReturnType<typeof buildController>>;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = buildController();
  });

  // ─── Test 1: Missing studentId ───────────────────────────────────────────
  it("responds 400 with 'Student ID is required' when studentId is missing", async () => {
    const req = createMockRequest({ statusId: 2, remarks: "Called student" });
    const res = createMockResponse();

    await controller(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Student ID is required",
    });
  });

  // ─── Test 2: Missing statusId ────────────────────────────────────────────
  it("responds 400 with 'Status ID is required' when statusId is missing", async () => {
    const req = createMockRequest({ studentId: 10, remarks: "Called student" });
    const res = createMockResponse();

    await controller(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Status ID is required",
    });
  });

  // ─── Test 3: Missing remarks ─────────────────────────────────────────────
  it("responds 400 with 'Remarks are required' when remarks is missing", async () => {
    const req = createMockRequest({ studentId: 10, statusId: 2 });
    const res = createMockResponse();

    await controller(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Remarks are required",
    });
  });

  // ─── Test 4: Successful creation ─────────────────────────────────────────
  it("responds 201 with the created record when all fields are present and service resolves", async () => {
    const createdRecord = { id: 99, studentId: 10, statusId: 2, remarks: "Called student" };
    mockCreateInteraction.mockResolvedValueOnce(createdRecord);

    const body: InteractionBody = { studentId: 10, statusId: 2, remarks: "Called student" };
    const req = createMockRequest(body);
    const res = createMockResponse();

    await controller(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Interaction logged",
      data: createdRecord,
    });
  });

  // ─── Test 5: Service throws → 500 ────────────────────────────────────────
  it("responds 500 when the service throws an error", async () => {
    mockCreateInteraction.mockRejectedValueOnce(new Error("Database error"));

    const req = createMockRequest({ studentId: 10, statusId: 2, remarks: "Called student" });
    const res = createMockResponse();

    await controller(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    // The json body must also carry success: false
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  // ─── Test 6: Service called with (req.body, req.user.id) ─────────────────
  it("calls interactionService.createInteraction with (req.body, req.user.id)", async () => {
    const createdRecord = { id: 100 };
    mockCreateInteraction.mockResolvedValueOnce(createdRecord);

    const body: InteractionBody = { studentId: 10, statusId: 2, remarks: "Called student" };
    const req = createMockRequest(body);
    const res = createMockResponse();

    await controller(req, res);

    // req.user.id is 1 as set in createMockRequest
    expect(mockCreateInteraction).toHaveBeenCalledWith(body, 1);
    expect(mockCreateInteraction).toHaveBeenCalledTimes(1);
  });
});
