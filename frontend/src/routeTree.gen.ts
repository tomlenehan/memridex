/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as SignupImport } from './routes/signup'
import { Route as ResetPasswordImport } from './routes/reset-password'
import { Route as RecoverPasswordImport } from './routes/recover-password'
import { Route as LoginImport } from './routes/login'
import { Route as LandingImport } from './routes/landing'
import { Route as LayoutImport } from './routes/_layout'
import { Route as LayoutIndexImport } from './routes/_layout/index'
import { Route as LayoutUserstorypromptsImport } from './routes/_layout/user_story_prompts'
import { Route as LayoutStoriesImport } from './routes/_layout/stories'
import { Route as LayoutSettingsImport } from './routes/_layout/settings'
import { Route as LayoutItemsImport } from './routes/_layout/items'
import { Route as LayoutConversationsImport } from './routes/_layout/conversations'
import { Route as LayoutAdminImport } from './routes/_layout/admin'
import { Route as LayoutSummarySummaryIdImport } from './routes/_layout/summary/$summaryId'
import { Route as LayoutConversationConversationIdImport } from './routes/_layout/conversation/$conversationId'

// Create/Update Routes

const SignupRoute = SignupImport.update({
  path: '/signup',
  getParentRoute: () => rootRoute,
} as any)

const ResetPasswordRoute = ResetPasswordImport.update({
  path: '/reset-password',
  getParentRoute: () => rootRoute,
} as any)

const RecoverPasswordRoute = RecoverPasswordImport.update({
  path: '/recover-password',
  getParentRoute: () => rootRoute,
} as any)

const LoginRoute = LoginImport.update({
  path: '/login',
  getParentRoute: () => rootRoute,
} as any)

const LandingRoute = LandingImport.update({
  path: '/landing',
  getParentRoute: () => rootRoute,
} as any)

const LayoutRoute = LayoutImport.update({
  id: '/_layout',
  getParentRoute: () => rootRoute,
} as any)

const LayoutIndexRoute = LayoutIndexImport.update({
  path: '/',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutUserstorypromptsRoute = LayoutUserstorypromptsImport.update({
  path: '/user_story_prompts',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutStoriesRoute = LayoutStoriesImport.update({
  path: '/stories',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutSettingsRoute = LayoutSettingsImport.update({
  path: '/settings',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutItemsRoute = LayoutItemsImport.update({
  path: '/items',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutConversationsRoute = LayoutConversationsImport.update({
  path: '/conversations',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutAdminRoute = LayoutAdminImport.update({
  path: '/admin',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutSummarySummaryIdRoute = LayoutSummarySummaryIdImport.update({
  path: '/summary/$summaryId',
  getParentRoute: () => LayoutRoute,
} as any)

const LayoutConversationConversationIdRoute =
  LayoutConversationConversationIdImport.update({
    path: '/conversation/$conversationId',
    getParentRoute: () => LayoutRoute,
  } as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/_layout': {
      preLoaderRoute: typeof LayoutImport
      parentRoute: typeof rootRoute
    }
    '/landing': {
      preLoaderRoute: typeof LandingImport
      parentRoute: typeof rootRoute
    }
    '/login': {
      preLoaderRoute: typeof LoginImport
      parentRoute: typeof rootRoute
    }
    '/recover-password': {
      preLoaderRoute: typeof RecoverPasswordImport
      parentRoute: typeof rootRoute
    }
    '/reset-password': {
      preLoaderRoute: typeof ResetPasswordImport
      parentRoute: typeof rootRoute
    }
    '/signup': {
      preLoaderRoute: typeof SignupImport
      parentRoute: typeof rootRoute
    }
    '/_layout/admin': {
      preLoaderRoute: typeof LayoutAdminImport
      parentRoute: typeof LayoutImport
    }
    '/_layout/conversations': {
      preLoaderRoute: typeof LayoutConversationsImport
      parentRoute: typeof LayoutImport
    }
    '/_layout/items': {
      preLoaderRoute: typeof LayoutItemsImport
      parentRoute: typeof LayoutImport
    }
    '/_layout/settings': {
      preLoaderRoute: typeof LayoutSettingsImport
      parentRoute: typeof LayoutImport
    }
    '/_layout/stories': {
      preLoaderRoute: typeof LayoutStoriesImport
      parentRoute: typeof LayoutImport
    }
    '/_layout/user_story_prompts': {
      preLoaderRoute: typeof LayoutUserstorypromptsImport
      parentRoute: typeof LayoutImport
    }
    '/_layout/': {
      preLoaderRoute: typeof LayoutIndexImport
      parentRoute: typeof LayoutImport
    }
    '/_layout/conversation/$conversationId': {
      preLoaderRoute: typeof LayoutConversationConversationIdImport
      parentRoute: typeof LayoutImport
    }
    '/_layout/summary/$summaryId': {
      preLoaderRoute: typeof LayoutSummarySummaryIdImport
      parentRoute: typeof LayoutImport
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren([
  LayoutRoute.addChildren([
    LayoutAdminRoute,
    LayoutConversationsRoute,
    LayoutItemsRoute,
    LayoutSettingsRoute,
    LayoutStoriesRoute,
    LayoutUserstorypromptsRoute,
    LayoutIndexRoute,
    LayoutConversationConversationIdRoute,
    LayoutSummarySummaryIdRoute,
  ]),
  LandingRoute,
  LoginRoute,
  RecoverPasswordRoute,
  ResetPasswordRoute,
  SignupRoute,
])

/* prettier-ignore-end */
