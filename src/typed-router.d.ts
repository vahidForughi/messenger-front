/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck
// Generated by unplugin-vue-router. ‼️ DO NOT MODIFY THIS FILE ‼️
// It's recommended to commit this file.
// Make sure to add this file to your tsconfig.json file as an "includes" or "files" entry.

declare module 'vue-router/auto-routes' {
  import type {
    RouteRecordInfo,
    ParamValue,
    ParamValueOneOrMore,
    ParamValueZeroOrMore,
    ParamValueZeroOrOne,
  } from 'unplugin-vue-router/types'

  /**
   * Route name map generated by unplugin-vue-router
   */
  export interface RouteNamedMap {
    '/': RouteRecordInfo<'/', '/', Record<never, never>, Record<never, never>>,
    '/messenger': RouteRecordInfo<'/messenger', '/messenger', Record<never, never>, Record<never, never>>,
    '/messenger/users': RouteRecordInfo<'/messenger/users', '/messenger/users', Record<never, never>, Record<never, never>>,
    '/messenger/users/[user_id]': RouteRecordInfo<'/messenger/users/[user_id]', '/messenger/users/:user_id', { user_id: ParamValue<true> }, { user_id: ParamValue<false> }>,
  }
}