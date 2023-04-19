import {BootMixin} from '@loopback/boot';
import {ApplicationConfig, createBindingFromClass} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication, RestBindings} from '@loopback/rest';
import {RestExplorerBindings, RestExplorerComponent} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {MySequence} from './sequence';
import {authenticateRequest, CasbinAuthorizationComponent, AuthorizationHeaderOASEnhancer, GCSchedulerComponent, rateLimiter, httpLogging, DecryptBodyJsonParser, authenticateAppUserState} from 'common';
import {AuthorizationComponent} from '@loopback/authorization';
import {ModifyResponseProvider,Compression} from 'common';

export {ApplicationConfig};

export class UserManagementService extends BootMixin(ServiceMixin(RepositoryMixin(RestApplication))) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Allows modification of response
    this.bind(RestBindings.SequenceActions.SEND).toProvider(ModifyResponseProvider);
    this.expressMiddleware('compression',Compression.Compress())
    // Set up the custom sequence
    this.sequence(MySequence);

    this.add(createBindingFromClass(AuthorizationHeaderOASEnhancer));
    this.middleware(authenticateRequest.bind(this));
    this.middleware(rateLimiter.bind(this));
    this.bodyParser(DecryptBodyJsonParser, RestBindings.REQUEST_BODY_PARSER_JSON);
    
    
    // Customize @loopback/rest-explorer configuration here
    if(process.env.NODE_ENV?.toLowerCase() != 'production' &&  !process.env.HIDE_SWAGGER ){
      // Set up default home page
      this.static('/', path.join(__dirname, '../public'));
      this.configure(RestExplorerBindings.COMPONENT).to({
        path: '/explorer'
      });
      this.component(RestExplorerComponent);
    }
    this.middleware(httpLogging.bind(this));
    this.middleware(authenticateAppUserState.bind(this))

    this.component(AuthorizationComponent);
    this.component(CasbinAuthorizationComponent);
    this.component(GCSchedulerComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true
      },
      models: {
        // Customize ModelBooter Conventions here
        dirs: ['models', path.join(__dirname, '../node_modules/common/dist/models')],
        extensions: ['.model.js'],
        nested: true
      },
      repositories: {
        // Customize RepositoryBooter Conventions here
        dirs: ['repositories'],
        extensions: ['.repository.js'],
        nested: true
      },
      datasources: {
        // Customize RepositoryBooter Conventions here
        dirs: ['datasources'],
        extensions: ['.datasource.js'],
        nested: true
      },
      services: {
        // Customize ServiceBooter Conventions here
        dirs: ['services', 'facades', 'engines'],
        extensions: ['.service.js', '.facade.js', '.engine.js'],
        nested: true
      }
    };
  }
}
