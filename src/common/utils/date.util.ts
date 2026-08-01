export class DateUtil {
  static getMonthRange(month: number, year: number) {
    return {
      startDate: new Date(year, month - 1, 1),
      endDate: new Date(year, month, 1),
    };
  }
}
