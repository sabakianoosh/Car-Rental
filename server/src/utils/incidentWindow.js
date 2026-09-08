/** Rental statuses where the user may register new incidents */
export const INCIDENT_REPORT_STATUSES = ['delivered'];

export function canUserReportIncidents(rental) {
  return Boolean(rental && INCIDENT_REPORT_STATUSES.includes(rental.status));
}

export function incidentWindowMessage(rental) {
  if (!rental) return null;
  if (rental.status === 'paid') {
    return 'پس از تحویل خودرو در شعبه، ثبت رخداد برای شما فعال می‌شود.';
  }
  if (rental.status === 'delivered') {
    return 'ثبت رخداد از لحظه تحویل تا قبل از بازگشت خودرو به شعبه فعال است.';
  }
  if (rental.status === 'completed') {
    return 'خودرو بازگردانده شده است. ثبت رخداد جدید امکان‌پذیر نیست.';
  }
  return null;
}

export function enrichRentalForClient(rental) {
  if (!rental) return rental;
  return {
    ...rental,
    canReportIncidents: canUserReportIncidents(rental),
    incidentWindowMessage: incidentWindowMessage(rental),
  };
}
