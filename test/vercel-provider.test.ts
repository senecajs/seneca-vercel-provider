/* Copyright © 2022 Seneca Project Contributors, MIT License. */

import * as Fs from 'fs'
import * as Http from 'http'

const Seneca = require('seneca')
const SenecaMsgTest = require('seneca-msg-test')

import VercelProvider from '../src/vercel-provider'
import VercelProviderDoc from '../src/VercelProvider-doc'

const BasicMessages = require('./basic.messages.js')

// Live tests call the Vercel API. They need a Vercel token: test/local-env.js
// (see local-env-template.js) or the environment variable VERCEL_USERTOKEN.
// The load test also needs a project id: test/local-config.js (see
// local-config-template.js) or the environment variable VERCEL_PROJECT_ID.
// Without a token the same tests run against a local mock of the Vercel
// API, and the env plugin gets a dummy token.
const ENV: any = {}
const CONFIG: any = {
  VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID,
  VERCEL_PROJECT_NAME: process.env.VERCEL_PROJECT_NAME,
}

// Get env vars from local-env.js.
if (Fs.existsSync(__dirname + '/local-env.js')) {
  Object.assign(ENV, require(__dirname + '/local-env.js'))
}
// Get CONFIGS from local-config.js.
if (Fs.existsSync(__dirname + '/local-config.js')) {
  Object.assign(CONFIG, require(__dirname + '/local-config.js'))
}

const LIVE = !!(ENV.VERCEL_USERTOKEN || process.env.VERCEL_USERTOKEN)

const MOCK_PROJECT0_ID = 'prj_Mock0000000000000000000000'

if (!LIVE) {
  process.env.VERCEL_USERTOKEN ??= 'test-usertoken'
  CONFIG.VERCEL_PROJECT_ID = MOCK_PROJECT0_ID
  CONFIG.VERCEL_PROJECT_NAME = 'mock-project'
}


let mock: MockVercelApi | null = null

beforeAll(async () => {
  if (!LIVE) {
    mock = await makeMockVercelApi()
  }
})

afterAll(async () => {
  if (mock) {
    await mock.close()
  }
})


describe('vercel-provider', () => {

  test('happy', async () => {
    expect(VercelProvider).toBeDefined()
    expect(VercelProviderDoc).toBeDefined()

    const seneca = await makeSeneca()

    expect(await seneca.post('sys:provider,provider:vercel,get:info'))
      .toMatchObject({
        ok: true,
        name: 'vercel',
      })

    await seneca.close()
  })


  test('messages', async () => {
    const seneca = await makeSeneca()
    await (SenecaMsgTest(seneca, BasicMessages)())
    await seneca.close()
  })


  test('projects-basic-list', async () => {
    const seneca = await makeSeneca()

    const list = await seneca.entity("provider/vercel/project").list$()
    expect(list.length > 0).toBeTruthy()

    if (mock) {
      expect(list[0].id).toEqual(MOCK_PROJECT0_ID)
      expect(mock.calls.map((c) => c.method + ' ' + c.path))
        .toEqual(['GET /v9/projects'])
    }

    await seneca.close()
  })

  test('projects-basic-load', async () => {
    if (!CONFIG.VERCEL_PROJECT_ID) return;

    const seneca = await makeSeneca()

    const load = await seneca.entity("provider/vercel/project").load$(CONFIG.VERCEL_PROJECT_ID)
    expect(null == load).toBeFalsy()

    if (mock) {
      expect(load.id).toEqual(MOCK_PROJECT0_ID)
      expect(load.name).toEqual('mock-project')
      expect(mock.calls.map((c) => c.method + ' ' + c.path))
        .toEqual(['GET /v9/projects/' + MOCK_PROJECT0_ID])
    }

    await seneca.close()
  })

  // IMPORTANT: live, this test creates a real project on Vercel. There is no
  // sandbox on Vercel (09-06-2022), so it runs only against the mock.
  ; (LIVE ? test.skip : test)('projects-basic-save', async () => {
    const seneca = await makeSeneca()

    const save = await seneca.entity("provider/vercel/project")
      .data$({ framework: 'nextjs' })
      .save$()
    expect(save.id).toBeDefined()
    expect(save.name).toEqual('mock-project')
    expect(save.framework).toEqual('nextjs')

    expect(mock!.calls.map((c) => c.method + ' ' + c.path))
      .toEqual(['POST /v9/projects'])

    // The project name comes from the projectname key.
    expect(mock!.calls[0].body)
      .toEqual({ name: 'mock-project', framework: 'nextjs' })

    await seneca.close()
  })

})


async function makeSeneca() {
  const seneca = Seneca({ legacy: false })
    .test()
    .use('@seneca/entity')
    .use('@seneca/env', {
      // debug: true,
      file: [__dirname + '/local-env.js;?'],
      var: {
        $VERCEL_USERTOKEN: String
      }
    })
    .use('@seneca/provider', {
      provider: {
        vercel: {
          keys: {
            usertoken: { value: '$VERCEL_USERTOKEN' },
            projectname: { value: CONFIG.VERCEL_PROJECT_NAME }
          }
        }
      }
    })
    .use(VercelProvider, {
      // The plugin option url replaces the Vercel API endpoint.
      ...(mock ? { url: mock.url + '/v9/' } : {}),
    })

  await seneca.ready()

  if (mock) {
    mock.calls.length = 0
  }

  return seneca
}


type MockCall = {
  method?: string
  path: string
  body: any
}

type MockVercelApi = {
  url: string
  calls: MockCall[]
  close: () => Promise<void>
}


// A local stand-in for the Vercel REST API calls that the tests make:
// GET /v9/projects, GET /v9/projects/{idOrName} and POST /v9/projects. It
// needs a bearer token, as Vercel does. The project objects and the error
// bodies ({ error: { code, message } }) have the shape of the Vercel REST
// API reference, with a few fields.
async function makeMockVercelApi(): Promise<MockVercelApi> {
  const calls: MockCall[] = []
  let nextId = 1

  const projects: Record<string, any> = {
    [MOCK_PROJECT0_ID]: makeProject(MOCK_PROJECT0_ID, { name: 'mock-project' }),
  }

  function makeProject(id: string, data: any) {
    return {
      accountId: 'team_Mock000000000000000000000',
      createdAt: 1763683200000,
      updatedAt: 1763683200000,
      framework: null,
      nodeVersion: '24.x',
      ...data,
      id,
    }
  }

  const server = Http.createServer((req, res) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      const url = new URL(req.url || '/', 'http://127.0.0.1')
      const path = url.pathname
      const text = Buffer.concat(chunks).toString()
      const body = '' === text ? undefined : JSON.parse(text)

      // The token never reaches the record of calls.
      calls.push({ method: req.method, path, body })

      const send = (status: number, out: any) => {
        res.writeHead(status, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(out))
      }

      if (req.headers.authorization !==
        'Bearer ' + process.env.VERCEL_USERTOKEN) {
        return send(403, {
          error: {
            code: 'forbidden',
            message: 'Not authorized',
            invalidToken: true,
          }
        })
      }

      if ('/v9/projects' === path) {
        if ('GET' === req.method) {
          return send(200, {
            projects: Object.values(projects),
            pagination: { count: Object.keys(projects).length, next: null, prev: null },
          })
        }

        if ('POST' === req.method) {
          const id = 'prj_Mock' + String(nextId++).padStart(22, '0')
          projects[id] = makeProject(id, body)
          return send(200, projects[id])
        }
      }

      const projectPath = path.match(/^\/v9\/projects\/([^/]+)$/)
      if (projectPath && 'GET' === req.method) {
        const idOrName = decodeURIComponent(projectPath[1])
        const project = Object.values(projects).find((p: any) =>
          p.id === idOrName || p.name === idOrName)
        if (null == project) {
          return send(404, {
            error: { code: 'not_found', message: 'Project not found' }
          })
        }
        return send(200, project)
      }

      send(404, { error: { code: 'not_found', message: 'The page could not be found' } })
    })
  })

  await new Promise<void>((resolve) =>
    server.listen(0, '127.0.0.1', () => resolve()))

  const port = (server.address() as { port: number }).port

  return {
    url: `http://127.0.0.1:${port}`,
    calls,
    close: () => new Promise<void>((resolve) => {
      server.closeAllConnections()
      server.close(() => resolve())
    })
  }
}
