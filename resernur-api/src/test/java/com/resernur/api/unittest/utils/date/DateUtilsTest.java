package com.resernur.api.unittest.utils.date;


import com.resernur.api.utils.date.CustomDateObject;
import com.resernur.api.utils.date.DateUtils;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

public class DateUtilsTest {

    @Test
    public void testGetDateFromLocalDateTime() {
        //Arrange
        DateUtils dateUtils = new DateUtils();
        LocalDateTime myBirthday = LocalDateTime.of(2004, 1, 27, 0, 0);
        LocalDateTime marchFirst2004 = LocalDateTime.of(2004, 3, 1, 0, 0);

        //Act

        CustomDateObject customMyBirthday = dateUtils.getDateFromLocalDateTime(myBirthday);
        CustomDateObject customMarchFirst2004 = dateUtils.getDateFromLocalDateTime(marchFirst2004);

        //Assrt
        Assertions.assertEquals("27", customMyBirthday.getDay());
        Assertions.assertEquals("01", customMarchFirst2004.getDay());
        Assertions.assertEquals(marchFirst2004.getHour(), Integer.parseInt(customMarchFirst2004.getHourDataObject().getHour()));

        Assertions.assertEquals("03", customMarchFirst2004.getMonth());
        Assertions.assertEquals("2004", customMarchFirst2004.getYear());
    }

    @Test
    public void testOverlaps() {
        //Arrange
        DateUtils dateUtils = new DateUtils();
        LocalDateTime date1 = LocalDateTime.of(2024, 6, 1, 10, 0);
        LocalDateTime date2 = LocalDateTime.of(2024, 6, 1, 11, 0);
        LocalDateTime date3 = LocalDateTime.of(2024, 6, 1, 10, 30);

        //Act
        boolean overlaps1 = dateUtils.overlaps(date1, date2);
        boolean overlaps2 = dateUtils.overlaps(date1, date3);

        //Assert
        Assertions.assertTrue(overlaps1);
        Assertions.assertTrue(overlaps2);
    }

    @Test
    public void testOverlaps_CustomDateObject() {
        DateUtils dateUtils = new DateUtils();
        // d1: 01/01/2024 10:00, d2: 01/01/2024 11:00, d3: 01/01/2024 09:00
        CustomDateObject d1 = new CustomDateObject("01", "01", "2024", buildHour("10", "00"));
        CustomDateObject d2 = new CustomDateObject("01", "01", "2024", buildHour("11", "00"));
        CustomDateObject d3 = new CustomDateObject("01", "01", "2024", buildHour("09", "00"));
        // d1 is before d2 (should overlap)
        Assertions.assertTrue(dateUtils.overlaps(d1, d2));
        // d2 is not before d3 (should not overlap)
        Assertions.assertFalse(dateUtils.overlaps(d2, d3));
        // d1 is equal to d1 (should overlap)
        Assertions.assertTrue(dateUtils.overlaps(d1, d1));
    }

    // Auxiliar para crear HourDataObject correctamente
    private static com.resernur.api.utils.date.HourDataObject buildHour(String hour, String min) {
        com.resernur.api.utils.date.HourDataObject h = new com.resernur.api.utils.date.HourDataObject();
        h.setHour(hour);
        h.setMinute(min);
        return h;
    }

    @Test
    public void testGetDayName() {
        DateUtils dateUtils = new DateUtils();
        LocalDateTime date = LocalDateTime.of(2024, 5, 2, 0, 0); // Thursday
        Assertions.assertEquals("Thursday", dateUtils.getDayName(date));
    }

    @Test
    public void testGetDayNameSpanish() {
        DateUtils dateUtils = new DateUtils();
        LocalDateTime date = LocalDateTime.of(2024, 5, 2, 0, 0); // jueves
        Assertions.assertEquals("jueves", dateUtils.getDayNameSpanish(date).toLowerCase());
    }

    @Test
    public void testIsHourEarlierThan() {
        DateUtils dateUtils = new DateUtils();
        Assertions.assertTrue(dateUtils.isHourEarlierThan("08:00", "09:00"));
        Assertions.assertFalse(dateUtils.isHourEarlierThan("10:00", "09:00"));
    }

    @Test
    public void testIsHourLaterThan() {
        DateUtils dateUtils = new DateUtils();
        Assertions.assertTrue(dateUtils.isHourLaterThan("10:00", "09:00"));
        Assertions.assertFalse(dateUtils.isHourLaterThan("08:00", "09:00"));
    }

    @Test
    public void testDatesSpanInBetweenHours() {
        DateUtils dateUtils = new DateUtils();
        CustomDateObject start = new CustomDateObject("01", "01", "2024", new com.resernur.api.utils.date.HourDataObject("09", "00"));
        CustomDateObject end = new CustomDateObject("01", "01", "2024", new com.resernur.api.utils.date.HourDataObject("18", "00"));
        Assertions.assertTrue(dateUtils.DatesSpanInBetweenHours(start, end, "08:00", "20:00"));
        Assertions.assertFalse(dateUtils.DatesSpanInBetweenHours(start, end, "10:00", "17:00"));
    }

    @Test
    public void testHoursBetweenDates() {
        DateUtils dateUtils = new DateUtils();
        LocalDateTime d1 = LocalDateTime.of(2024, 5, 2, 10, 0);
        LocalDateTime d2 = LocalDateTime.of(2024, 5, 2, 15, 0);
        Assertions.assertEquals(5, dateUtils.hoursBetweenDates(d1, d2));
    }

    @Test
    public void testDaysBetweenDates() {
        DateUtils dateUtils = new DateUtils();
        LocalDateTime d1 = LocalDateTime.of(2024, 5, 2, 10, 0);
        LocalDateTime d2 = LocalDateTime.of(2024, 5, 7, 10, 0);
        Assertions.assertEquals(5, dateUtils.daysBetweenDates(d1, d2));
    }
}
