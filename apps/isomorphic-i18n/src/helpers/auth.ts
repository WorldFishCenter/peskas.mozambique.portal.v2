import intersection from "lodash/intersection"
import isEqual from "lodash/isEqual"
import sortBy from "lodash/sortBy"

import { TGroup, TPermission } from "@repo/nosql/schema/auth"

export function hasPermission(groups?: TGroup[], resource?: string, actions?: string[]) {
  if (!groups) return false

  return groups?.some(group => {
    const perm = group.permission_id as unknown as TPermission | undefined
    return perm?.domain.some(dom => 
      dom.resource === resource && isEqual(sortBy(intersection(dom.actions, actions)), sortBy(actions))
    ) 
  })
}
