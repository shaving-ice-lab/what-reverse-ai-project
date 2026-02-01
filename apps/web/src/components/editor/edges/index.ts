/**
 * 自定义边类型导出
 */

export * from "./labeled-edge";

// 边类型注册映射
import {
  LabeledEdge,
  DeletableEdge,
  ConditionalEdge,
  AnimatedEdge,
  ExecutingEdge,
} from "./labeled-edge";

export const edgeTypes = {
  labeled: LabeledEdge,
  deletable: DeletableEdge,
  conditional: ConditionalEdge,
  animated: AnimatedEdge,
  executing: ExecutingEdge,
};
