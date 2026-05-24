/**
 * Unit tests for the getPaginationMeta utility function.
 *
 * All 6 scenarios mandated by the task spec are covered, plus a few
 * extra edge-case tests added for robustness.
 */

import { getPaginationMeta } from "../utils/pagination.util";

describe("getPaginationMeta", () => {
  // ─── Scenario 1 ─────────────────────────────────────────────────────────────
  // Standard first-page result
  describe("Scenario 1 — standard first page (100 records, page 1, limit 10)", () => {
    const result = getPaginationMeta(100, 1, 10);

    it("returns totalPages = 10", () => {
      expect(result.totalPages).toBe(10);
    });

    it("returns hasNextPage = true", () => {
      expect(result.hasNextPage).toBe(true);
    });

    it("returns hasPrevPage = false (no page before page 1)", () => {
      expect(result.hasPrevPage).toBe(false);
    });

    it("echoes back total, currentPage, and limit unchanged", () => {
      expect(result.total).toBe(100);
      expect(result.currentPage).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  // ─── Scenario 2 ─────────────────────────────────────────────────────────────
  // On the last page, there should be no next page
  describe("Scenario 2 — last page (100 records, page 10, limit 10)", () => {
    const result = getPaginationMeta(100, 10, 10);

    it("returns hasNextPage = false", () => {
      expect(result.hasNextPage).toBe(false);
    });

    it("returns hasPrevPage = true", () => {
      expect(result.hasPrevPage).toBe(true);
    });
  });

  // ─── Scenario 3 ─────────────────────────────────────────────────────────────
  // Middle page — both prev and next exist
  describe("Scenario 3 — middle page (50 records, page 3, limit 5)", () => {
    const result = getPaginationMeta(50, 3, 5);

    it("returns hasNextPage = true", () => {
      expect(result.hasNextPage).toBe(true);
    });

    it("returns hasPrevPage = true", () => {
      expect(result.hasPrevPage).toBe(true);
    });

    it("returns totalPages = 10", () => {
      // 50 / 5 = 10 pages
      expect(result.totalPages).toBe(10);
    });
  });

  // ─── Scenario 4 ─────────────────────────────────────────────────────────────
  // Records do not divide evenly → last page is partial
  describe("Scenario 4 — partial last page (23 records, page 3, limit 10)", () => {
    const result = getPaginationMeta(23, 3, 10);

    it("returns totalPages = 3  (ceil(23/10))", () => {
      expect(result.totalPages).toBe(3);
    });

    it("returns hasNextPage = false (already on last page)", () => {
      expect(result.hasNextPage).toBe(false);
    });
  });

  // ─── Scenario 5 ─────────────────────────────────────────────────────────────
  // Fewer records than the page limit → everything fits on one page
  describe("Scenario 5 — single page (5 records, page 1, limit 10)", () => {
    const result = getPaginationMeta(5, 1, 10);

    it("returns totalPages = 1", () => {
      expect(result.totalPages).toBe(1);
    });

    it("returns hasNextPage = false", () => {
      expect(result.hasNextPage).toBe(false);
    });

    it("returns hasPrevPage = false", () => {
      expect(result.hasPrevPage).toBe(false);
    });
  });

  // ─── Scenario 6 ─────────────────────────────────────────────────────────────
  // Empty dataset
  describe("Scenario 6 — zero total records", () => {
    const result = getPaginationMeta(0, 1, 10);

    it("returns totalPages = 0", () => {
      expect(result.totalPages).toBe(0);
    });

    it("returns hasNextPage = false", () => {
      expect(result.hasNextPage).toBe(false);
    });

    it("returns hasPrevPage = false", () => {
      expect(result.hasPrevPage).toBe(false);
    });

    it("returns total = 0", () => {
      expect(result.total).toBe(0);
    });
  });
});
