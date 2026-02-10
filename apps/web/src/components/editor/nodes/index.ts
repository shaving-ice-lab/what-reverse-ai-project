/**
 * CustomNodeTypeExport
 */

export * from './base-node'
export * from './start-node'
export * from './end-node'
export * from './llm-node'
export * from './http-node'
export * from './condition-node'
export * from './loop-node'
export * from './code-node'
export * from './template-node'
export * from './variable-node'
export * from './input-node'
export * from './output-node'
export * from './expression-node'
export * from './try-catch-node'
export * from './transform-node'
export * from './regex-node'
export * from './text-split-node'
export * from './merge-node'
export * from './filter-node'
export * from './parallel-node'
export * from './delay-node'
export * from './webhook-node'
export * from './document-assembler-node'
export * from './database-node'
export { default as GroupNode } from './group-node'

// NodeTypeSign UpMapping
import { BaseNode } from './base-node'
import { StartNode } from './start-node'
import { EndNode } from './end-node'
import { LLMNode } from './llm-node'
import { HTTPNode } from './http-node'
import { ConditionNode } from './condition-node'
import { LoopNode } from './loop-node'
import { CodeNode } from './code-node'
import { TemplateNode } from './template-node'
import { VariableNode } from './variable-node'
import { InputNode } from './input-node'
import { OutputNode } from './output-node'
import { ExpressionNode } from './expression-node'
import { TryCatchNode } from './try-catch-node'
import { TransformNode } from './transform-node'
import { RegexNode } from './regex-node'
import { TextSplitNode } from './text-split-node'
import { MergeNode } from './merge-node'
import { FilterNode } from './filter-node'
import { ParallelNode } from './parallel-node'
import { DelayNode } from './delay-node'
import { WebhookNode } from './webhook-node'
import { DocumentAssemblerNode } from './document-assembler-node'
import { DatabaseNode } from './database-node'
import GroupNode from './group-node'

export const nodeTypes = {
  base: BaseNode,
  start: StartNode,
  end: EndNode,
  llm: LLMNode,
  http: HTTPNode,
  condition: ConditionNode,
  loop: LoopNode,
  code: CodeNode,
  template: TemplateNode,
  variable: VariableNode,
  input: InputNode,
  output: OutputNode,
  expression: ExpressionNode,
  trycatch: TryCatchNode,
  transform: TransformNode,
  regex: RegexNode,
  textsplit: TextSplitNode,
  merge: MergeNode,
  filter: FilterNode,
  parallel: ParallelNode,
  delay: DelayNode,
  webhook: WebhookNode,
  documentAssembler: DocumentAssemblerNode,
  db_select: DatabaseNode,
  db_insert: DatabaseNode,
  db_update: DatabaseNode,
  db_delete: DatabaseNode,
  db_migrate: DatabaseNode,
  group: GroupNode,
}
