import AZPrefixSearchController from '../../../main/controllers/AZPrefixSearchController';
import { ChooseServiceAreaController } from '../../../main/controllers/ChooseServiceAreaController';
import { ChooseServiceController } from '../../../main/controllers/ChooseServiceController';
import CourtController from '../../../main/controllers/CourtController';
import InfoController from '../../../main/controllers/InfoController';
import PostcodeResultsController from '../../../main/controllers/PostcodeResultsController';
import PostcodeSearchController from '../../../main/controllers/PostcodeSearchController';
import SearchByLocationController from '../../../main/controllers/SearchByLocationController';
import SearchController from '../../../main/controllers/SearchController';
import ServiceCentreController from '../../../main/controllers/ServiceCentreController';
import ServiceSearchResultsController from '../../../main/controllers/ServiceSearchResultsController';

describe('controllers with default dependencies', () => {
  test('constructors can be instantiated without explicit dependency injection', () => {
    expect(new AZPrefixSearchController()).toBeInstanceOf(AZPrefixSearchController);
    expect(new ChooseServiceAreaController()).toBeInstanceOf(ChooseServiceAreaController);
    expect(new ChooseServiceController()).toBeInstanceOf(ChooseServiceController);
    expect(new CourtController()).toBeInstanceOf(CourtController);
    expect(new InfoController()).toBeInstanceOf(InfoController);
    expect(new PostcodeResultsController()).toBeInstanceOf(PostcodeResultsController);
    expect(new PostcodeSearchController()).toBeInstanceOf(PostcodeSearchController);
    expect(new SearchByLocationController()).toBeInstanceOf(SearchByLocationController);
    expect(new SearchController()).toBeInstanceOf(SearchController);
    expect(new ServiceCentreController()).toBeInstanceOf(ServiceCentreController);
    expect(new ServiceSearchResultsController()).toBeInstanceOf(ServiceSearchResultsController);
  });
});
