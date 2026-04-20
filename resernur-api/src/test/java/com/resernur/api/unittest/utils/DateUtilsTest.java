package com.resernur.api.unittest.utils;


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
}
