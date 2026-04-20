package com.resernur.api.utils.date;

import lombok.Data;

@Data
public class HourDataObject {
    private String hour;
    private String minute;

    public String GetFullHour(){
        return this.hour + ":" + this.minute;
    }
}
