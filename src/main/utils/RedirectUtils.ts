import { Response } from 'express';

export const servicePostcodeSearchRedirect = (
  res: Response,
  service: string,
  serviceArea: string,
  action: string,
  error?: string | null,
  noResults?: boolean
): void => {
  if (error) {
    return res.redirect(`/services/${service}/${serviceArea}/${action}/search-by-postcode?error=${error}`);
  } else if (noResults) {
    return res.redirect(`/services/${service}/${serviceArea}/${action}/search-by-postcode?noResults=true`);
  }
  return res.redirect(`/services/${service}/${serviceArea}/${action}/search-by-postcode`);
};

export const postcodeSearchRedirect = (res: Response, error?: string | null, noResults?: boolean): void => {
  if (error) {
    return res.redirect(`/search-by-postcode?error=${error}`);
  } else if (noResults) {
    return res.redirect('/search-by-postcode?noResults=true');
  }
  return res.redirect('/search-by-postcode');
};
