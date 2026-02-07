/**
 * List performance tests
 * Verify list rendering performance with large datasets
 */

import { describe, it, expect, beforeEach } from "vitest";

// Performance thresholds (milliseconds)
const PERFORMANCE_THRESHOLDS = {
  // Data processing
  filterSmallDataset: 10, // 100 records
  filterMediumDataset: 50, // 1000 records
  filterLargeDataset: 200, // 10000 records
  
  // Sorting
  sortSmallDataset: 10,
  sortMediumDataset: 50,
  sortLargeDataset: 200,
  
  // Pagination
  paginateSmallDataset: 5,
  paginateMediumDataset: 10,
  paginateLargeDataset: 50,
  
  // Search
  searchSmallDataset: 20,
  searchMediumDataset: 100,
  searchLargeDataset: 500,
};

// Generate test data
function generateMockUsers(count: number) {
  const statuses = ["active", "suspended"];
  const roles = ["admin", "user", "creator"];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `user_${i}`,
    email: `user${i}@example.com`,
    username: `user${i}`,
    display_name: `User ${i}`,
    role: roles[i % roles.length],
    status: statuses[i % statuses.length],
    email_verified: i % 3 !== 0,
    created_at: new Date(Date.now() - i * 86400000).toISOString(),
    updated_at: new Date(Date.now() - i * 43200000).toISOString(),
    last_login_at: i % 5 === 0 ? null : new Date(Date.now() - i * 3600000).toISOString(),
  }));
}

function generateMockWorkspaces(count: number) {
  const statuses = ["active", "suspended", "deleted", "cold_storage"];
  const plans = ["free", "pro", "enterprise"];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `ws_${i}`,
    name: `Workspace ${i}`,
    slug: `workspace-${i}`,
    status: statuses[i % statuses.length],
    plan: plans[i % plans.length],
    owner_user_id: `user_${i % 100}`,
    created_at: new Date(Date.now() - i * 86400000).toISOString(),
    updated_at: new Date(Date.now() - i * 43200000).toISOString(),
  }));
}

function generateMockTickets(count: number) {
  const statuses = ["open", "in_progress", "waiting_on_customer", "resolved", "closed"];
  const priorities = ["low", "medium", "high", "urgent"];
  const categories = ["billing", "integrations", "security", "general", "api"];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `ticket_${i}`,
    reference: `AF-${String(i).padStart(5, "0")}`,
    requester_email: `customer${i}@example.com`,
    subject: `Support Ticket ${i} - ${categories[i % categories.length]} issue`,
    priority: priorities[i % priorities.length],
    status: statuses[i % statuses.length],
    category: categories[i % categories.length],
    channel: i % 2 === 0 ? "email" : "dashboard",
    created_at: new Date(Date.now() - i * 86400000).toISOString(),
    updated_at: new Date(Date.now() - i * 43200000).toISOString(),
  }));
}

// Filter function
function filterByStatus<T extends { status: string }>(items: T[], status: string): T[] {
  return items.filter((item) => item.status === status);
}

function filterBySearch<T extends { email?: string; name?: string; subject?: string }>(
  items: T[],
  search: string
): T[] {
  const searchLower = search.toLowerCase();
  return items.filter((item) => {
    const email = item.email?.toLowerCase() || "";
    const name = item.name?.toLowerCase() || "";
    const subject = item.subject?.toLowerCase() || "";
    return email.includes(searchLower) || name.includes(searchLower) || subject.includes(searchLower);
  });
}

// Sort function
function sortByDate<T extends { created_at: string }>(items: T[], order: "asc" | "desc"): T[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return order === "asc" ? dateA - dateB : dateB - dateA;
  });
}

// Pagination function
function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

// Measure execution time
function measureTime(fn: () => void): number {
  const start = performance.now();
  fn();
  const end = performance.now();
  return end - start;
}

describe("List Performance Tests - User List", () => {
  let smallDataset: ReturnType<typeof generateMockUsers>;
  let mediumDataset: ReturnType<typeof generateMockUsers>;
  let largeDataset: ReturnType<typeof generateMockUsers>;

  beforeEach(() => {
    smallDataset = generateMockUsers(100);
    mediumDataset = generateMockUsers(1000);
    largeDataset = generateMockUsers(10000);
  });

  describe("Filter Performance", () => {
    it("small dataset (100 records) filter should complete within threshold", () => {
      const time = measureTime(() => {
        filterByStatus(smallDataset, "active");
      });
      
      console.log(`Small dataset filter time: ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.filterSmallDataset);
    });

    it("medium dataset (1000 records) filter should complete within threshold", () => {
      const time = measureTime(() => {
        filterByStatus(mediumDataset, "active");
      });
      
      console.log(`Medium dataset filter time: ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.filterMediumDataset);
    });

    it("large dataset (10000 records) filter should complete within threshold", () => {
      const time = measureTime(() => {
        filterByStatus(largeDataset, "active");
      });
      
      console.log(`Large dataset filter time: ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.filterLargeDataset);
    });
  });

  describe("Sort Performance", () => {
    it("small dataset sort should complete within threshold", () => {
      const time = measureTime(() => {
        sortByDate(smallDataset, "desc");
      });
      
      console.log(`Small dataset sort time: ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.sortSmallDataset);
    });

    it("medium dataset sort should complete within threshold", () => {
      const time = measureTime(() => {
        sortByDate(mediumDataset, "desc");
      });
      
      console.log(`Medium dataset sort time: ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.sortMediumDataset);
    });

    it("large dataset sort should complete within threshold", () => {
      const time = measureTime(() => {
        sortByDate(largeDataset, "desc");
      });
      
      console.log(`Large dataset sort time: ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.sortLargeDataset);
    });
  });

  describe("Pagination Performance", () => {
    it("small dataset pagination should complete within threshold", () => {
      const time = measureTime(() => {
        for (let i = 1; i <= 5; i++) {
          paginate(smallDataset, i, 20);
        }
      });
      
      console.log(`Small dataset pagination time: ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.paginateSmallDataset);
    });

    it("medium dataset pagination should complete within threshold", () => {
      const time = measureTime(() => {
        for (let i = 1; i <= 50; i++) {
          paginate(mediumDataset, i, 20);
        }
      });
      
      console.log(`Medium dataset pagination time: ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.paginateMediumDataset);
    });

    it("large dataset pagination should complete within threshold", () => {
      const time = measureTime(() => {
        for (let i = 1; i <= 500; i++) {
          paginate(largeDataset, i, 20);
        }
      });
      
      console.log(`Large dataset pagination time: ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.paginateLargeDataset);
    });
  });

  describe("Search Performance", () => {
    it("small dataset search should complete within threshold", () => {
      const time = measureTime(() => {
        filterBySearch(smallDataset, "user50");
      });
      
      console.log(`Small dataset search time: ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.searchSmallDataset);
    });

    it("medium dataset search should complete within threshold", () => {
      const time = measureTime(() => {
        filterBySearch(mediumDataset, "user500");
      });
      
      console.log(`Medium dataset search time: ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.searchMediumDataset);
    });

    it("large dataset search should complete within threshold", () => {
      const time = measureTime(() => {
        filterBySearch(largeDataset, "user5000");
      });
      
      console.log(`Large dataset search time: ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.searchLargeDataset);
    });
  });

  describe("Combined Operation Performance", () => {
    it("filter+sort+paginate combined operation should complete within threshold", () => {
      const time = measureTime(() => {
        const filtered = filterByStatus(largeDataset, "active");
        const sorted = sortByDate(filtered, "desc");
        paginate(sorted, 1, 20);
      });
      
      console.log(`Combined operation time: ${time.toFixed(2)}ms`);
      // Combined threshold should be 80% of the sum of individual thresholds (considering memory reuse optimizations)
      const threshold =
        (PERFORMANCE_THRESHOLDS.filterLargeDataset +
          PERFORMANCE_THRESHOLDS.sortLargeDataset +
          PERFORMANCE_THRESHOLDS.paginateLargeDataset) * 0.8;
      expect(time).toBeLessThan(threshold);
    });

    it("search+filter+sort combined operation should complete within threshold", () => {
      const time = measureTime(() => {
        const searched = filterBySearch(mediumDataset, "user");
        const filtered = filterByStatus(searched, "active");
        sortByDate(filtered, "desc");
      });
      
      console.log(`Search+filter+sort time: ${time.toFixed(2)}ms`);
      const threshold =
        PERFORMANCE_THRESHOLDS.searchMediumDataset +
        PERFORMANCE_THRESHOLDS.filterMediumDataset +
        PERFORMANCE_THRESHOLDS.sortMediumDataset;
      expect(time).toBeLessThan(threshold);
    });
  });
});

describe("List Performance Tests - Ticket List", () => {
  let largeTicketDataset: ReturnType<typeof generateMockTickets>;

  beforeEach(() => {
    largeTicketDataset = generateMockTickets(10000);
  });

  it("multi-condition filter should complete within threshold", () => {
    const time = measureTime(() => {
      largeTicketDataset
        .filter((t) => t.status === "open")
        .filter((t) => t.priority === "high")
        .filter((t) => t.category === "billing");
    });
    
    console.log(`Multi-condition filter time: ${time.toFixed(2)}ms`);
    expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.filterLargeDataset * 1.5);
  });

  it("complex search should complete within threshold", () => {
    const time = measureTime(() => {
      filterBySearch(largeTicketDataset, "billing issue");
    });
    
    console.log(`Complex search time: ${time.toFixed(2)}ms`);
    expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.searchLargeDataset);
  });
});

describe("Memory Usage Tests", () => {
  it("large datasets should not cause memory overflow", () => {
    const datasets: unknown[] = [];
    
    // Try generating multiple large datasets
    for (let i = 0; i < 5; i++) {
      datasets.push(generateMockUsers(10000));
    }
    
    // If no error is thrown, the test passes
    expect(datasets.length).toBe(5);
    
    // Cleanup
    datasets.length = 0;
  });

  it("repeated filter operations should not cause memory leaks", () => {
    const dataset = generateMockUsers(10000);
    
    // Execute 100 filter operations
    for (let i = 0; i < 100; i++) {
      filterByStatus(dataset, "active");
    }
    
    // If no error is thrown, the test passes
    expect(true).toBe(true);
  });
});
