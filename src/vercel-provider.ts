/* Copyright © 2022 Seneca Project Contributors, MIT License. */
import { VercelProviderOptions } from './types'
import { getJSON, makeConfig, makeUrl, postJSON } from './utils'

const Pkg = require('../package.json')


function VercelProvider(this: any, options: VercelProviderOptions) {
  const seneca: any = this

  const entityBuilder = this.export('provider/entityBuilder')


  seneca.message('sys:provider,provider:vercel,get:info', get_info)

  async function get_info(this: any, _msg: any) {
    return {
      ok: true,
      name: 'vercel',
      version: Pkg.version,
    }
  }

  entityBuilder(this, {
    provider: {
      name: 'vercel'
    },
    entity: {
      projects: {
        cmd: {
          list: {
            action: async function(this: any, entize: any, msg: any) {
              let json: any = await getJSON(makeUrl('projects', msg.q, options), makeConfig(seneca))
              let projects = json.projects
              let list = projects.map((data: any) => entize(data))

              // TODO: ensure seneca-transport preserves array props
              list.page = json.page

              return list
            },
          },
          load: {
            action: async function(this: any, entize: any, msg: any) {
              let json: any = await getJSON(makeUrl('project', msg.q, options), makeConfig(seneca))
              let project = json.project
              let list = project.map((data: any) => entize(data))

              // TODO: ensure seneca-transport preserves array props
              list.page = json.page

              return list
            },
          },
          save: {
            action: async function(this: any, entize: any, msg: any) {
              let body = this.util.deep(
                this.shared.primary,
                options.entity.order.save,
                msg.ent.data$(false)
              )

              let json: any = await postJSON(makeUrl('projects', msg.q, options), makeConfig(seneca, {
                body
              }), options)

              let project = json
              project.id = project.referenceOrderID
              return entize(project)
            },
          }
        }
      }
    }
  })



  seneca.prepare(async function(this: any) {
    let res =
      await this.post('sys:provider,get:keymap,provider:tangocard')

    if (!res.ok) {
      throw this.fail('keymap')
    }

    let src = res.keymap.name.value + ':' + res.keymap.key.value
    let auth = Buffer.from(src).toString('base64')

    this.shared.headers = {
      Authorization: 'Basic ' + auth
    }

    this.shared.primary = {
      customerIdentifier: res.keymap.cust.value,
      accountIdentifier: res.keymap.acc.value,
    }

  })


  return {
    exports: {
      makeUrl,
      makeConfig,
      getJSON,
      postJSON,
    }
  }
}


// Default options.
const defaults: VercelProviderOptions = {

  // Vercel Projects API Endpoint /
  url: 'https://api.vercel.com/v9/projects/',

  // Use global fetch by default - if exists
  fetch: ('undefined' === typeof fetch ? undefined : fetch),

  entity: {
    projects: {
      list: {
        // Default fields
      },
      load: {
        // Default fields
      },
      save: {
        // Default fields
      }
    }
  },

  // TODO: Enable debug logging
  debug: false
}


Object.assign(VercelProvider, { defaults })

export default VercelProvider

if ('undefined' !== typeof (module)) {
  module.exports = VercelProvider
}
