/* Copyright © 2022 Seneca Project Contributors, MIT License. */
import fetch from "node-fetch"

const Pkg = require('../package.json')

export type VercelProviderOptions = {
  url: string
  fetch: any
  debug: boolean
}

function VercelProvider(this: any, options: VercelProviderOptions) {
  const seneca: any = this

  const makeUtils = this.export("provider/makeUtils")

  const { makeUrl, getJSON, postJSON, entityBuilder } = makeUtils({
    name: "vercel",
    url: options.url,
  })

  seneca.message('sys:provider,provider:vercel,get:info', get_info)

  const makeConfig = (config?: any) =>
  seneca.util.deep(
    {
      headers: {
        ...seneca.shared.headers,
      },
    },
    config
  )

  async function get_info(this: any, _msg: any) {
    return {
      ok: true,
      name: 'vercel',
      version: Pkg.version,
      mark: true
    }
  }

  entityBuilder(this, {
    provider: {
      name: 'vercel'
    },
    entity: {
      project: {
        cmd: {
          list: {
            action: async function(this: any, entize: any, msg: any) {
              const res: any = await getJSON(makeUrl("projects", msg.q), makeConfig())
              const { projects } = res
              let list = projects.map((data: any) => entize(data))

              // TODO: ensure seneca-transport preserves array props
              list.page = res.page
              
              return list
            },
          },
          load: {
            action: async function(this: any, entize: any, msg: any) {
              const res: any = await getJSON(makeUrl("projects", msg.q.id), makeConfig())
              let load = res ? entize(res) : null

              // TODO: ensure seneca-transport preserves array props
              load.page = res.page

              return load
            },
          },
          save: {
            action: async function(this: any, entize: any, msg: any) {
              const body = this.util.deep(
                this.shared.primary,
                msg.ent.data$(false)
              )

              const res: any = await postJSON(makeUrl("projects", msg.q), makeConfig({ body }))

              const project = res
              return entize(project)
            },
          }
        }
      }
    }
  })



  seneca.prepare(async function(this: any) {
    let res = await this.post('sys:provider,get:keymap,provider:vercel')

    if (!res.ok) {
      throw this.fail('keymap')
    }

    let auth = res.keymap.usertoken.value

    this.shared.headers = {
      Authorization: 'Bearer ' + auth,
    }

    this.shared.primary = {
      name: res.keymap.projectname.value,
    }

  })
}


// Default options.
const defaults: VercelProviderOptions = {

  // Vercel Projects API Endpoint /
  url: 'https://api.vercel.com/v9/',
  
  // Use global fetch by default - if exists
  fetch: ('undefined' === typeof fetch ? undefined : fetch),

  // TODO: Enable debug logging
  debug: false
}


Object.assign(VercelProvider, { defaults })

export default VercelProvider

if ('undefined' !== typeof (module)) {
  module.exports = VercelProvider
}
