describe('main bundle index', () => {
  test('initialises GOV.UK frontend when the bundle is loaded', () => {
    jest.resetModules();

    const initAll = jest.fn();
    jest.doMock('govuk-frontend', () => ({ initAll }));
    jest.doMock('../../../main/assets/scss/main.scss', () => ({}));
    jest.doMock('../../../main/bundles/cookie-preferences', () => ({}));

    require('../../../main/bundles/index');

    expect(initAll).toHaveBeenCalledTimes(1);
  });
});
