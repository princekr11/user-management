import {authorize} from '@loopback/authorization';
import {service} from '@loopback/core';
import {get, response, param} from '@loopback/rest';
import {HSLRedirectFacade} from '../facades/hsl-redirect.facade';

/**
 * A simple controller to get HSL redirect url.
 */
@authorize({})
export class HSLRedirectController {
  constructor(@service(HSLRedirectFacade) public hslRedirectFacade: HSLRedirectFacade) {}

  /**
   *
   * @param tag - Requires to identify redirect url
   * @returns
   */
  @get('/hsl/{tag}')
  @response(200, {
    description: 'HSL Redirect Response',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          title: 'HSLRedirectResponse',
          properties: {
            redirectURL: {type: 'string'}
          }
        }
      }
    }
  })
  async hslRedirect(@param.path.string('tag') tag: string): Promise<string | object> {
    return this.hslRedirectFacade.getRedirectURL(tag);
  }
}
