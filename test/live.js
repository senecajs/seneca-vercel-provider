const Seneca = require('seneca')


Seneca({ legacy: false })
  .test()
  .use('@seneca/entity')
  .use('@seneca/env', {
    // debug: true,
    file: [__dirname + '/local-env.js;?'],
    var: {
      $VERCEL_USERTOKEN: String,
    }
  })
  .use('@seneca/provider', {
    provider: {
        vercel: {
          keys: {
            usertoken: { value: '$VERCEL_USERTOKEN' },
          }
        }
    }
  })
  .use('../')
  .ready(async function() {
    const seneca = this

    console.log(await seneca.post('sys:provider,provider:vercel,get:info'))
    
    const projectsList = await seneca.entity("provider/vercel/projects").list$()
    console.log('projectsList',projectsList.length)

    // const projectLoad = await seneca.entity("provider/vercel/projects").load$()
    // console.log('projectLoad',projectLoad.id)

    // const projectsSave = await seneca.entity("provider/vercel/projects").save$()
    // console.log('projectsSave',projectsSave.length)
    

    try {
      createProject = await createProject.save$()
      console.log('project',project)
    }

    catch(e) {
      console.log(e.message)
      console.log(e.status)
      console.log(e.body)
    }

  })

