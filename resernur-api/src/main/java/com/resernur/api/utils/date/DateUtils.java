package com.resernur.api.utils.date;

import org.springframework.cglib.core.Local;

import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.Date;
import java.util.Locale;

public class DateUtils {

    public CustomDateObject getDateFromLocalDateTime(LocalDateTime localDateTime) {
        String day = String.format("%02d", localDateTime.getDayOfMonth());
        String month = String.format("%02d", localDateTime.getMonthValue());
        String year = String.valueOf(localDateTime.getYear());
        HourDataObject hourDataObject = new HourDataObject();
        hourDataObject.setHour(String.format("%02d", localDateTime.getHour()));
        hourDataObject.setMinute(String.format("%02d", localDateTime.getMinute()));
        return new CustomDateObject(day, month, year, hourDataObject);
    }

    public boolean overlaps(CustomDateObject date1, CustomDateObject date2) {
        LocalDateTime dateTime1 = LocalDateTime.of(
                Integer.parseInt(date1.getYear()),
                Integer.parseInt(date1.getMonth()),
                Integer.parseInt(date1.getDay()),
                Integer.parseInt(date1.getHourDataObject().getHour()),
                Integer.parseInt(date1.getHourDataObject().getMinute())
        );

        LocalDateTime dateTime2 = LocalDateTime.of(
                Integer.parseInt(date2.getYear()),
                Integer.parseInt(date2.getMonth()),
                Integer.parseInt(date2.getDay()),
                Integer.parseInt(date2.getHourDataObject().getHour()),
                Integer.parseInt(date2.getHourDataObject().getMinute())
        );

        return dateTime1.isBefore(dateTime2) || dateTime1.isEqual(dateTime2);
    }

    public boolean overlaps(LocalDateTime date1, LocalDateTime date2) {
        return date1.isBefore(date2) || date1.isEqual(date2);
    }

    public String getDayName(LocalDateTime date){
        String name = date.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
        return name;
    }

    public String getDayNameSpanish(LocalDateTime date){
        String name = date.getDayOfWeek().getDisplayName(TextStyle.FULL, new Locale("es", "ES"));
        return name;
    }





}
