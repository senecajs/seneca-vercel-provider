![Seneca Vercel-Provider](http://senecajs.org/files/assets/seneca-logo.png)

> _Seneca Vercel-Provider_ is a plugin for [Seneca](http://senecajs.org)


Provides access to the Vercel API using the Seneca *provider*
convention. Vercel API entities are represented as Seneca entities so
that they can be accessed using the Seneca entity API and messages.

See [seneca-entity](senecajs/seneca-entity) and the [Seneca Data
Entities
Tutorial](https://senecajs.org/docs/tutorials/understanding-data-entities.html) for more details on the Seneca entity API.

NOTE: underlying third party SDK needs to be replaced as out of date and has a security issue.

[![npm version](https://img.shields.io/npm/v/@seneca/vercel-provider.svg)](https://npmjs.com/package/@seneca/vercel-provider)
[![build](https://github.com/senecajs/seneca-vercel-provider/actions/workflows/build.yml/badge.svg)](https://github.com/senecajs/seneca-vercel-provider/actions/workflows/build.yml)
[![Coverage Status](https://coveralls.io/repos/github/senecajs/seneca-vercel-provider/badge.svg?branch=main)](https://coveralls.io/github/senecajs/seneca-vercel-provider?branch=main)
[![Known Vulnerabilities](https://snyk.io/test/github/senecajs/seneca-vercel-provider/badge.svg)](https://snyk.io/test/github/senecajs/seneca-vercel-provider)
[![DeepScan grade](https://deepscan.io/api/teams/5016/projects/19462/branches/505954/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=5016&pid=19462&bid=505954)
[![Maintainability](https://api.codeclimate.com/v1/badges/f76e83896b731bb5d609/maintainability)](https://codeclimate.com/github/senecajs/seneca-vercel-provider/maintainability)


| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|


## Quick Example


```js

// Setup - get the key value (<SECRET>) separately from a vault or
// environment variable.
Seneca()
  // Get API keys using the seneca-env plugin
  .use('env', {
    var: {
      $VERCEL_USERTOKEN: String,
    }
  })
  .use('provider', {
    provider: {
      vercel: {
        keys: {
          usertoken: { value: '$VERCEL_USERTOKEN' },
        }
      }
    }
  })
  .use('vercel-provider')

let board = await seneca.entity('provider/vercel/board')
  .load$('<vercel-board-id>')

Console.log('BOARD', board)

board.desc = 'New description'
board = await board.save$()

Console.log('UPDATED BOARD', board)

```

## Install

```sh
$ npm install @seneca/vercel-provider @seneca/env
```



<!--START:options-->


## Options

* `debug` : boolean <i><small>false</small></i>


Set plugin options when loading with:
```js


seneca.use('VercelProvider', { name: value, ... })


```


<small>Note: <code>foo.bar</code> in the list above means 
<code>{ foo: { bar: ... } }</code></small> 



<!--END:options-->

<!--START:action-list-->


## Action Patterns

* [role:entity,base:vercel,cmd:load,name:repo,zone:provider](#-roleentitybasevercelcmdloadnamerepozoneprovider-)
* [role:entity,base:vercel,cmd:save,name:repo,zone:provider](#-roleentitybasevercelcmdsavenamerepozoneprovider-)
* [sys:provider,get:info,provider:vercel](#-sysprovidergetinfoprovidervercel-)


<!--END:action-list-->

<!--START:action-desc-->


## Action Descriptions

### &laquo; `role:entity,base:vercel,cmd:list,name:repo,zone:provider` &raquo;

List Vercel repository data into an entity.

----------
### &laquo; `role:entity,base:vercel,cmd:load,name:repo,zone:provider` &raquo;

Load Vercel repository data into an entity.

----------
### &laquo; `role:entity,base:vercel,cmd:save,name:repo,zone:provider` &raquo;

Update Vercel repository data from an entity.



----------
### &laquo; `sys:provider,get:info,provider:vercel` &raquo;

Get information about the provider.



----------


<!--END:action-desc-->
