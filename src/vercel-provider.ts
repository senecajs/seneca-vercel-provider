/* Copyright © 2022 Seneca Project Contributors, MIT License. */
import { VercelProviderOptions } from './types'
import { getJSON, makeConfig, makeUrl, postJSON } from './utils'

const Pkg = require('../package.json')

import fetch from "node-fetch";

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
      project: {
        cmd: {
          list: {
            action: async function(this: any, entize: any, msg: any) {
              const res: any = await getJSON(makeUrl('projects', msg.q, options), options, makeConfig(this))
              let projects = res.projects
              let list = projects.map((data: any) => entize(data))

              // TODO: ensure seneca-transport preserves array props
              list.page = res.page
              
              return list
            },
          },
          load: {
            action: async function(this: any, entize: any, msg: any) {
              const res: any = await getJSON(makeUrl('projects', msg.q.id, options), options, makeConfig(this))
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
                options.entity.projects.save,
                msg.ent.data$(false)
              )

              const res: any = await postJSON(makeUrl('projects', msg.q, options), makeConfig(this,{
                body
              }), options)

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
  url: 'https://api.vercel.com/v9/',
  
  // Use global fetch by default - if exists
  fetch: ('undefined' === typeof fetch ? undefined : fetch),

  entity: {
    projects: {
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
