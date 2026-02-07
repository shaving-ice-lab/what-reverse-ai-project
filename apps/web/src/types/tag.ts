/**
 * TagsRelatedTypeDefinition
 */

/**
 * WorkflowTags
 */
export interface Tag {
 /** Tags ID */
 id: string;
 /** User ID */
 user_id: string;
 /** TagsName */
 name: string;
 /** TagsColor */
 color: string;
 /** Created At */
 created_at: string;
}

/**
 * UsageCount'sTags
 */
export interface TagWithCount extends Tag {
 /** UsageCount */
 count: number;
}

/**
 * beforeendpointShowcaseuse'sTags
 */
export interface WorkflowTag {
 id: string;
 name: string;
 color: string;
 count: number;
}
