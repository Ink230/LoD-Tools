import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, DetachedRouteHandle, Route, RouteReuseStrategy } from '@angular/router';

/** Keep live editor sessions (including file handles and renderer state) in this tab. */
@Injectable()
export class EditorRouteReuseStrategy implements RouteReuseStrategy {
  private readonly sessions = new Map<Route, DetachedRouteHandle>();

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return route.routeConfig?.data?.['preserveEditorSession'] === true;
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    if (!route.routeConfig) return;
    if (handle) this.sessions.set(route.routeConfig, handle);
    else this.sessions.delete(route.routeConfig);
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return !!route.routeConfig && this.sessions.has(route.routeConfig);
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return route.routeConfig ? this.sessions.get(route.routeConfig) ?? null : null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, current: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === current.routeConfig;
  }
}
