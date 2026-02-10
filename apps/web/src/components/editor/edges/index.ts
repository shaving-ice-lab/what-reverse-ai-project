/**
 * CustomEdgeTypeExport
 */

export * from './labeled-edge'

// EdgeTypeSign UpMapping
import {
  LabeledEdge,
  DeletableEdge,
  ConditionalEdge,
  AnimatedEdge,
  ExecutingEdge,
} from './labeled-edge'

export const edgeTypes = {
  labeled: LabeledEdge,
  deletable: DeletableEdge,
  conditional: ConditionalEdge,
  animated: AnimatedEdge,
  executing: ExecutingEdge,
}
