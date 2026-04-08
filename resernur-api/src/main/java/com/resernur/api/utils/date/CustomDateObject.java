package com.resernur.api.utils.date;

import lombok.Data;

@Data
public class CustomDateObject {

    private String day;
    private String month;
    private String year;
    private HourDataObject hourDataObject;

    public CustomDateObject(String day, String month, String year, HourDataObject hourDataObject) {
        this.day = day;
        this.month = month;
        this.year = year;
        this.hourDataObject = hourDataObject;
    }

}
