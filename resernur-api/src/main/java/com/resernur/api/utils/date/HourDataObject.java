package com.resernur.api.utils.date;

import lombok.Data;

@Data
public class HourDataObject {
    private String hour;
    private String minute;

    public HourDataObject(String hour, String minute) {
        this.hour = hour;
        this.minute = minute;
    }

    public HourDataObject(){}

    public String GetFullHour(){
        return this.hour + ":" + this.minute;
    }
}
