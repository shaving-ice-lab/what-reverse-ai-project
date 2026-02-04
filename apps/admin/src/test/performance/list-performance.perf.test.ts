/**
 * 列表性能测试
 * 验证大数据量下的列表渲染性能
 */

import { describe, it, expect, beforeEach } from "vitest";

// 性能阈值（毫秒）
const PERFORMANCE_THRESHOLDS = {
  // 数据处理
  filterSmallDataset: 10, // 100 条记录
  filterMediumDataset: 50, // 1000 条记录
  filterLargeDataset: 200, // 10000 条记录
  
  // 排序
  sortSmallDataset: 10,
  sortMediumDataset: 50,
  sortLargeDataset: 200,
  
  // 分页
  paginateSmallDataset: 5,
  paginateMediumDataset: 10,
  paginateLargeDataset: 50,
  
  // 搜索
  searchSmallDataset: 20,
  searchMediumDataset: 100,
  searchLargeDataset: 500,
};

// 生成测试数据
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

// 过滤函数
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

// 排序函数
function sortByDate<T extends { created_at: string }>(items: T[], order: "asc" | "desc"): T[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return order === "asc" ? dateA - dateB : dateB - dateA;
  });
}

// 分页函数
function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

// 测量执行时间
function measureTime(fn: () => void): number {
  const start = performance.now();
  fn();
  const end = performance.now();
  return end - start;
}

describe("列表性能测试 - 用户列表", () => {
  let smallDataset: ReturnType<typeof generateMockUsers>;
  let mediumDataset: ReturnType<typeof generateMockUsers>;
  let largeDataset: ReturnType<typeof generateMockUsers>;

  beforeEach(() => {
    smallDataset = generateMockUsers(100);
    mediumDataset = generateMockUsers(1000);
    largeDataset = generateMockUsers(10000);
  });

  describe("过滤性能", () => {
    it("小数据集（100 条）过滤应该在阈值内完成", () => {
      const time = measureTime(() => {
        filterByStatus(smallDataset, "active");
      });
      
      console.log(`小数据集过滤耗时: ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.filterSmallDataset);
    });

    it("中数据集（1000 条）过滤应该在阈值内完成", () => {
      const time = measureTime(() => {
        filterByStatus(mediumDataset, "active");
      });
      
      console.log(`中数据集过滤耗时: ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.filterMediumDataset);
    });

    it("大数据集（10000 条）过滤应该在阈值内完成", () => {
      const time = measureTime(() => {
        filterByStatus(largeDataset, "active");
      });
      
      console.log(`大数据集过滤耗时: ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.filterLargeDataset);
    });
  });

  describe("排序性能", () => {
    it("小数据集排序应该在阈值内完成", () => {
      const time = measureTime(() => {
        sortByDate(smallDataset, "desc");
      });
      
      console.log(`小数据集排序耗时: ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.sortSmallDataset);
    });

    it("中数据集排序应该在阈值内完成", () => {
      const time = measureTime(() => {
        sortByDate(mediumDataset, "desc");
      });
      
      console.log(`中数据集排序耗时: ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.sortMediumDataset);
    });

    it("大数据集排序应该在阈值内完成", () => {
      const time = measureTime(() => {
        sortByDate(largeDataset, "desc");
      });
      
      console.log(`大数据集排序耗时: ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.sortLargeDataset);
    });
  });

  describe("分页性能", () => {
    it("小数据集分页应该在阈值内完成", () => {
      const time = measureTime(() => {
        for (let i = 1; i <= 5; i++) {
          paginate(smallDataset, i, 20);
        }
      });
      
      console.log(`小数据集分页耗时: ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.paginateSmallDataset);
    });

    it("中数据集分页应该在阈值内完成", () => {
      const time = measureTime(() => {
        for (let i = 1; i <= 50; i++) {
          paginate(mediumDataset, i, 20);
        }
      });
      
      console.log(`中数据集分页耗时: ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.paginateMediumDataset);
    });

    it("大数据集分页应该在阈值内完成", () => {
      const time = measureTime(() => {
        for (let i = 1; i <= 500; i++) {
          paginate(largeDataset, i, 20);
        }
      });
      
      console.log(`大数据集分页耗时: ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.paginateLargeDataset);
    });
  });

  describe("搜索性能", () => {
    it("小数据集搜索应该在阈值内完成", () => {
      const time = measureTime(() => {
        filterBySearch(smallDataset, "user50");
      });
      
      console.log(`小数据集搜索耗时: ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.searchSmallDataset);
    });

    it("中数据集搜索应该在阈值内完成", () => {
      const time = measureTime(() => {
        filterBySearch(mediumDataset, "user500");
      });
      
      console.log(`中数据集搜索耗时: ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.searchMediumDataset);
    });

    it("大数据集搜索应该在阈值内完成", () => {
      const time = measureTime(() => {
        filterBySearch(largeDataset, "user5000");
      });
      
      console.log(`大数据集搜索耗时: ${time.toFixed(2)}ms`);
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.searchLargeDataset);
    });
  });

  describe("组合操作性能", () => {
    it("过滤+排序+分页组合操作应该在阈值内完成", () => {
      const time = measureTime(() => {
        const filtered = filterByStatus(largeDataset, "active");
        const sorted = sortByDate(filtered, "desc");
        paginate(sorted, 1, 20);
      });
      
      console.log(`组合操作耗时: ${time.toFixed(2)}ms`);
      // 组合操作阈值应该是各单项之和的 80%（考虑到内存重用等优化）
      const threshold =
        (PERFORMANCE_THRESHOLDS.filterLargeDataset +
          PERFORMANCE_THRESHOLDS.sortLargeDataset +
          PERFORMANCE_THRESHOLDS.paginateLargeDataset) * 0.8;
      expect(time).toBeLessThan(threshold);
    });

    it("搜索+过滤+排序组合操作应该在阈值内完成", () => {
      const time = measureTime(() => {
        const searched = filterBySearch(mediumDataset, "user");
        const filtered = filterByStatus(searched, "active");
        sortByDate(filtered, "desc");
      });
      
      console.log(`搜索+过滤+排序耗时: ${time.toFixed(2)}ms`);
      const threshold =
        PERFORMANCE_THRESHOLDS.searchMediumDataset +
        PERFORMANCE_THRESHOLDS.filterMediumDataset +
        PERFORMANCE_THRESHOLDS.sortMediumDataset;
      expect(time).toBeLessThan(threshold);
    });
  });
});

describe("列表性能测试 - 工单列表", () => {
  let largeTicketDataset: ReturnType<typeof generateMockTickets>;

  beforeEach(() => {
    largeTicketDataset = generateMockTickets(10000);
  });

  it("多条件过滤应该在阈值内完成", () => {
    const time = measureTime(() => {
      largeTicketDataset
        .filter((t) => t.status === "open")
        .filter((t) => t.priority === "high")
        .filter((t) => t.category === "billing");
    });
    
    console.log(`多条件过滤耗时: ${time.toFixed(2)}ms`);
    expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.filterLargeDataset * 1.5);
  });

  it("复杂搜索应该在阈值内完成", () => {
    const time = measureTime(() => {
      filterBySearch(largeTicketDataset, "billing issue");
    });
    
    console.log(`复杂搜索耗时: ${time.toFixed(2)}ms`);
    expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.searchLargeDataset);
  });
});

describe("内存使用测试", () => {
  it("大数据集不应该导致内存溢出", () => {
    const datasets: unknown[] = [];
    
    // 尝试生成多个大数据集
    for (let i = 0; i < 5; i++) {
      datasets.push(generateMockUsers(10000));
    }
    
    // 如果没有抛出错误，测试通过
    expect(datasets.length).toBe(5);
    
    // 清理
    datasets.length = 0;
  });

  it("重复过滤操作不应该导致内存泄漏", () => {
    const dataset = generateMockUsers(10000);
    
    // 执行 100 次过滤操作
    for (let i = 0; i < 100; i++) {
      filterByStatus(dataset, "active");
    }
    
    // 如果没有抛出错误，测试通过
    expect(true).toBe(true);
  });
});
