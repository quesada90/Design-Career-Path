import { careerRoles, type CareerRole } from '../components/career-data';

export type RoleState = 'completed' | 'current' | 'target' | 'future';

/**
 * Build a reverse connection map (child -> parents)
 */
function buildReverseConnectionMap(): Map<string, string[]> {
  const reverseMap = new Map<string, string[]>();
  
  careerRoles.forEach((role) => {
    role.connections.forEach((connId) => {
      if (!reverseMap.has(connId)) {
        reverseMap.set(connId, []);
      }
      reverseMap.get(connId)!.push(role.id);
    });
  });
  
  return reverseMap;
}

/**
 * Get all roles that come before the current role (completed roles)
 * Traces backwards through the career path
 */
export function getCompletedRoles(currentRoleId: string | null): string[] {
  if (!currentRoleId) return [];
  
  const completed: string[] = [];
  const reverseMap = buildReverseConnectionMap();
  const visited = new Set<string>();
  
  function traceBackwards(roleId: string) {
    if (visited.has(roleId)) return;
    visited.add(roleId);
    
    const parents = reverseMap.get(roleId) || [];
    parents.forEach((parentId) => {
      completed.push(parentId);
      traceBackwards(parentId);
    });
  }
  
  traceBackwards(currentRoleId);
  return completed;
}

/**
 * Get roles that are directly reachable from the current role
 */
export function getAvailableTargets(currentRoleId: string | null): string[] {
  if (!currentRoleId) return [];
  
  const currentRole = careerRoles.find((r) => r.id === currentRoleId);
  return currentRole?.connections || [];
}

/**
 * Check if a role is reachable from current role (for target validation)
 */
export function isRoleReachableFromCurrent(
  currentRoleId: string | null,
  targetRoleId: string
): boolean {
  if (!currentRoleId) return false;
  if (currentRoleId === targetRoleId) return false;
  
  const visited = new Set<string>();
  const queue = [currentRoleId];
  
  while (queue.length > 0) {
    const roleId = queue.shift()!;
    if (visited.has(roleId)) continue;
    visited.add(roleId);
    
    const role = careerRoles.find((r) => r.id === roleId);
    if (!role) continue;
    
    if (role.connections.includes(targetRoleId)) return true;
    
    queue.push(...role.connections);
  }
  
  return false;
}

/**
 * Determine the state of a role based on current and target selections
 */
export function getRoleState(
  roleId: string,
  currentRoleId: string | null,
  targetRoleIds: string[]
): RoleState {
  if (roleId === currentRoleId) return 'current';
  if (targetRoleIds.includes(roleId)) return 'target';
  
  const completedRoles = getCompletedRoles(currentRoleId);
  if (completedRoles.includes(roleId)) return 'completed';
  
  return 'future';
}

/**
 * Get role by ID
 */
export function getRoleById(roleId: string): CareerRole | undefined {
  return careerRoles.find((r) => r.id === roleId);
}

/**
 * Get all edge keys ("fromId->toId") on the exact path from a future node back to current.
 * Used to highlight the full route when hovering a future node.
 */
export function getPathEdgesToCurrent(
  futureRoleId: string,
  currentRoleId: string | null
): Set<string> {
  if (!currentRoleId) return new Set();
  const reverseMap = buildReverseConnectionMap();
  const pathEdges = new Set<string>();
  const queue = [futureRoleId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const roleId = queue.shift()!;
    if (visited.has(roleId) || roleId === currentRoleId) continue;
    visited.add(roleId);

    const parents = reverseMap.get(roleId) || [];
    parents.forEach((parentId) => {
      pathEdges.add(`${parentId}->${roleId}`);
      queue.push(parentId);
    });
  }
  return pathEdges;
}

/**
 * Validate if a role can be set as target
 */
export function canSetAsTarget(
  roleId: string,
  currentRoleId: string | null
): boolean {
  if (!currentRoleId) return false;
  if (roleId === currentRoleId) return false;
  
  // Check if role is in completed roles (can't target past)
  const completedRoles = getCompletedRoles(currentRoleId);
  if (completedRoles.includes(roleId)) return false;
  
  // Check if role is reachable from current
  return isRoleReachableFromCurrent(currentRoleId, roleId);
}
