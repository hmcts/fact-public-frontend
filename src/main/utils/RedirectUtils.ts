import { Response } from 'express';

export const servicePostcodeSearchRedirect = (
  res: Response,
  service: string,
  serviceArea: string,
  action: string,
  error?: string | null,
  noResults?: boolean
): void => {
  const basePath = `/services/${service}/${serviceArea}/${action}/search-by-postcode`;
  if (error) {
    return res.redirect(`${basePath}?error=${error}`);
  } else if (noResults) {
    return res.redirect(`${basePath}?noResults=true`);
  }
  return res.redirect(basePath);
};

export const postcodeSearchRedirect = (res: Response, error?: string | null, noResults?: boolean): void => {
  const basePath = '/search-by-postcode';
  if (error) {
    return res.redirect(`${basePath}?error=${error}`);
  } else if (noResults) {
    return res.redirect(`${basePath}?noResults=true`);
  }
  return res.redirect(basePath);
};

export const servicePostcodeResultsRedirect = (
  res: Response,
  service: string,
  serviceArea: string,
  action: string,
  postcode: string
): void => {
  return res.redirect(
    `/services/${service}/${serviceArea}/${action}/search-by-postcode/courts/near?postcode=${postcode}`
  );
};

export const postcodeResultsRedirect = (res: Response, postcode: string): void => {
  return res.redirect(`/search-by-postcode/courts/near?postcode=${postcode}`);
};
