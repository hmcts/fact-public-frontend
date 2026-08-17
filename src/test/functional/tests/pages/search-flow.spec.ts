import { test } from '../../fixtures';
import { CourtTestData, createCourtTestData } from '../../helpers/courtTestData';

test.describe('Search Journey - Know Name', () => {
  let courtData!: CourtTestData;
  let createdCourtQuery: string;

  test.beforeAll(async ({ playwright }) => {
    courtData = await createCourtTestData(playwright, 'Search');
    createdCourtQuery = courtData.defaultCourt.name;
  });

  test.afterAll(async () => {
    if (courtData) {
      await courtData.cleanup();
    }
  });

  test('should go from start -> yes -> search by name -> show results (english)', async ({
    searchFlowPage,
    courtPage,
  }) => {
    await searchFlowPage.gotoStart('en');
    await searchFlowPage.expectPath('/');
    await searchFlowPage.expectTitle('Find a Court or Tribunal - GOV.UK');
    await searchFlowPage.clickStartNow();
    await searchFlowPage.expectPath('/search-option');
    await searchFlowPage.expectTitle('What is the court name? - Find a Court or Tribunal - GOV.UK');
    await searchFlowPage.expectHeading('Do you know the name of the court or tribunal?');

    await searchFlowPage.selectKnowsLocation('yes');
    await searchFlowPage.clickContinue();
    await searchFlowPage.expectPath('/search-by-name');
    await searchFlowPage.expectTitle('Search by name or address - Find a Court or Tribunal - GOV.UK');
    await searchFlowPage.expectHeading('What is the name or address of the court or tribunal?');

    await searchFlowPage.enterSearchQuery(createdCourtQuery);
    await searchFlowPage.clickContinue();
    await searchFlowPage.expectPath('/search-by-name');
    await searchFlowPage.expectSearchParam('search', createdCourtQuery);
    await searchFlowPage.expectTitle('Search Results - Find a Court or Tribunal - GOV.UK');
    await searchFlowPage.expectSearchResultsVisible();
    await searchFlowPage.expectSearchResultLinkText(courtData.defaultCourt.name);
    await searchFlowPage.expectSearchResultLinkHref(
      courtData.defaultCourt.name,
      `/courts/${courtData.defaultCourt.slug}`
    );
    await searchFlowPage.clickSearchResultLink(courtData.defaultCourt.name);
    await searchFlowPage.expectPath(`/courts/${courtData.defaultCourt.slug}`);
    await courtPage.expectHeadingToContainText(courtData.defaultCourt.name);
  });

  test('should go from start -> yes -> search by name -> show results (welsh)', async ({
    searchFlowPage,
    courtPage,
  }) => {
    await searchFlowPage.gotoStart('cy');
    await searchFlowPage.expectPath('/');
    await searchFlowPage.expectTitle('Find a Court or Tribunal - GOV.UK');
    await searchFlowPage.clickStartNow();
    await searchFlowPage.expectPath('/search-option');
    await searchFlowPage.expectTitle("Beth yw enw'r llys? - Dod o hyd i Lys neu Dribiwnlys - GOV.UK");
    await searchFlowPage.expectHeading("A ydych chi'n gwybod enw'r llys neu'r tribiwnlys?");

    await searchFlowPage.selectKnowsLocation('yes');
    await searchFlowPage.clickContinue();
    await searchFlowPage.expectPath('/search-by-name');
    await searchFlowPage.expectTitle('Chwiliwch yn ôl enw neu gyfeiriad - Dod o hyd i Lys neu Dribiwnlys - GOV.UK');
    await searchFlowPage.expectHeading("Beth yw enw a chyfeiriad y llys neu'r tribiwnlys?");

    await searchFlowPage.enterSearchQuery(createdCourtQuery);
    await searchFlowPage.clickContinue();
    await searchFlowPage.expectPath('/search-by-name');
    await searchFlowPage.expectSearchParam('search', createdCourtQuery);
    await searchFlowPage.expectTitle('Canlyniadau chwilio - Dod o hyd i lys neu dribiwnlys - GOV.UK');
    await searchFlowPage.expectSearchResultsVisible();
    await searchFlowPage.expectSearchResultLinkText(courtData.defaultCourt.name);
    await searchFlowPage.expectSearchResultLinkHref(
      courtData.defaultCourt.name,
      `/courts/${courtData.defaultCourt.slug}`
    );
    await searchFlowPage.clickSearchResultLink(courtData.defaultCourt.name);
    await searchFlowPage.expectPath(`/courts/${courtData.defaultCourt.slug}`);
    await courtPage.expectHeadingToContainText(courtData.defaultCourt.name);
  });
});

test.describe('Search Journey - Validation', () => {
  test('should show radio validation error when no answer is selected (english)', async ({ searchFlowPage }) => {
    await searchFlowPage.gotoStart('en');
    await searchFlowPage.clickStartNow();
    await searchFlowPage.expectPath('/search-option');
    await searchFlowPage.clickContinue();
    await searchFlowPage.expectPath('/search-option');
    await searchFlowPage.expectErrorSummaryVisible('Select if you have the name or not');
  });

  test('should show search validation error when search is blank (welsh)', async ({ searchFlowPage }) => {
    await searchFlowPage.gotoStart('cy');
    await searchFlowPage.clickStartNow();
    await searchFlowPage.selectKnowsLocation('yes');
    await searchFlowPage.clickContinue();
    await searchFlowPage.expectPath('/search-by-name');
    await searchFlowPage.clickContinue();
    await searchFlowPage.expectPath('/search-by-name');
    await searchFlowPage.expectErrorSummaryVisible('Rhowch enw llys, cyfeiriad, tref neu ddinas');
  });

  test('should show no-results panel for an unmatched query (english)', async ({ searchFlowPage }) => {
    await searchFlowPage.gotoStart('en');
    await searchFlowPage.clickStartNow();
    await searchFlowPage.selectKnowsLocation('yes');
    await searchFlowPage.clickContinue();
    await searchFlowPage.expectPath('/search-by-name');
    await searchFlowPage.enterSearchQuery('zzzzzzzzzzzzzzzzzzzz');
    await searchFlowPage.clickContinue();
    await searchFlowPage.expectPath('/search-by-name');
    await searchFlowPage.expectSearchParam('search', 'zzzzzzzzzzzzzzzzzzzz');
    await searchFlowPage.expectNoResultsVisible();
  });
});

test.describe('Search Journey - No Name Route', () => {
  test('should go from start -> no -> find/contact page (english)', async ({ searchFlowPage }) => {
    await searchFlowPage.gotoStart('en');
    await searchFlowPage.clickStartNow();
    await searchFlowPage.expectPath('/search-option');
    await searchFlowPage.expectTitle('What is the court name? - Find a Court or Tribunal - GOV.UK');
    await searchFlowPage.selectKnowsLocation('no');
    await searchFlowPage.clickContinue();
    await searchFlowPage.expectPath('/service-choose-action');
    await searchFlowPage.expectTitle('Find or contact a court - Find a Court or Tribunal - GOV.UK');
    await searchFlowPage.expectHeading('What do you want to do?');
  });

  test('should go from start -> no -> find/contact page (welsh)', async ({ searchFlowPage }) => {
    await searchFlowPage.gotoStart('cy');
    await searchFlowPage.clickStartNow();
    await searchFlowPage.expectPath('/search-option');
    await searchFlowPage.expectTitle("Beth yw enw'r llys? - Dod o hyd i Lys neu Dribiwnlys - GOV.UK");
    await searchFlowPage.selectKnowsLocation('no');
    await searchFlowPage.clickContinue();
    await searchFlowPage.expectPath('/service-choose-action');
    await searchFlowPage.expectTitle('Dod i hyd i, neu gysylltu â llys - Dod o hyd i Lys neu Dribiwnlys - GOV.UK');
    await searchFlowPage.expectHeading('Beth ydych chi eisiau ei wneud?');
  });
});
