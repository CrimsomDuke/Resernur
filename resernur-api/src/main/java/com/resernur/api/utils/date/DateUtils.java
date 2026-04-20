package com.resernur.api.utils.date;

import org.springframework.cglib.core.Local;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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

    public boolean isHourEarlierThan(String firstHour, String secondHour) {
        // LocalTime.parse expects "HH:mm" by default
        LocalTime time1 = LocalTime.parse(firstHour);
        LocalTime time2 = LocalTime.parse(secondHour);

        return time1.isBefore(time2);
    }

    public boolean isHourLaterThan(String firstHour, String secondHour){
        LocalTime time1 = LocalTime.parse(firstHour);
        LocalTime time2 = LocalTime.parse(secondHour);

        return time1.isAfter(time2);
    }

    public boolean DatesSpanInBetweenHours(CustomDateObject startDate, CustomDateObject endDate, String lowerBoundHours, String upperBoundHours) {
        //Get the "HH:mm" strings from your custom objects
        String startHourStr = startDate.getHourDataObject().GetFullHour();
        String endHourStr = endDate.getHourDataObject().GetFullHour();

        // It is NOT earlier than the lower bound AND NOT later than the upper bound
        boolean isAfterOpening = !isHourEarlierThan(startHourStr, lowerBoundHours);
        boolean isBeforeClosing = !isHourLaterThan(endHourStr, upperBoundHours);

        return isAfterOpening && isBeforeClosing;
    }

    public long hoursBetweenDates(LocalDateTime date1, LocalDateTime date2){
        Duration duration = Duration.between(date1, date2);
        return duration.toHours();
    }

    public long daysBetweenDates(LocalDateTime date1, LocalDateTime date2){
        Duration duration = Duration.between(date1, date2);
        return duration.toDays();
    }


}
