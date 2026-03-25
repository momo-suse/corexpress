import { setupServer } from 'msw/node'
import { authHandlers } from './handlers/auth'
import { commentHandlers } from './handlers/comments'
import { postHandlers } from './handlers/posts'
import { settingsHandlers } from './handlers/settings'

export const server = setupServer(
  ...authHandlers,
  ...postHandlers,
  ...commentHandlers,
  ...settingsHandlers,
)
