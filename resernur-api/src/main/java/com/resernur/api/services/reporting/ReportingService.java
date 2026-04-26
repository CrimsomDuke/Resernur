package com.resernur.api.services.reporting;

import com.resernur.api.models.bookings.Booking;
import com.resernur.api.models.enums.BookingStatus;
import com.resernur.api.repositories.bookings.BookingRepository;
import com.resernur.api.repositories.places.PlaceRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class ReportingService {
    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private PlaceRepository placeRepository;

    public byte[] generateBookingsReport(LocalDate from, LocalDate to) throws IOException {
        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);
        List<Booking> bookings = bookingRepository.findAllByDateRange(fromDateTime, toDateTime);
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Reservas");
        Row header = sheet.createRow(0);
        header.createCell(0).setCellValue("ID");
        header.createCell(1).setCellValue("Espacio");
        header.createCell(2).setCellValue("Solicitante");
        header.createCell(3).setCellValue("Tipo de Evento");
        header.createCell(4).setCellValue("Inicio");
        header.createCell(5).setCellValue("Fin");
        header.createCell(6).setCellValue("Estado");
        int rowIdx = 1;
        for (Booking b : bookings) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(b.getId());
            row.createCell(1).setCellValue(b.getPlace() != null ? b.getPlace().getName() : "");
            row.createCell(2).setCellValue(b.getBookingRequest() != null && b.getBookingRequest().getUser() != null ? b.getBookingRequest().getUser().getFullName() : "");
            row.createCell(3).setCellValue(b.getBookingRequest() != null && b.getBookingRequest().getActivityType() != null ? b.getBookingRequest().getActivityType().name() : "OTROS");
            row.createCell(4).setCellValue(b.getStartTime() != null ? b.getStartTime().toString() : "");
            row.createCell(5).setCellValue(b.getEndTime() != null ? b.getEndTime().toString() : "");
            row.createCell(6).setCellValue(b.getStatus() != null ? b.getStatus().name() : "");
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.close();
        return out.toByteArray();
    }

    public byte[] generateMostUsedPlacesReport(LocalDate from, LocalDate to) throws IOException {
        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);
        List<Object[]> results = bookingRepository.findMostUsedPlaces(BookingStatus.COMPLETED, fromDateTime, toDateTime);
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Espacios más usados");
        Row header = sheet.createRow(0);
        header.createCell(0).setCellValue("Espacio");
        header.createCell(1).setCellValue("Cantidad de Reservas");
        int rowIdx = 1;
        for (Object[] rowObj : results) {
            Integer placeId = (Integer) rowObj[0];
            Long count = (Long) rowObj[1];
            String placeName = placeRepository.findById(placeId).map(p -> p.getName()).orElse("");
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(placeName);
            row.createCell(1).setCellValue(count);
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.close();
        return out.toByteArray();
    }

    public byte[] generateCancelledOrRejectedReport(LocalDate from, LocalDate to) throws IOException {
        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);
        List<Booking> bookings = bookingRepository.findCancelledOrRejected(fromDateTime, toDateTime);
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Cancelados o Rechazados");
        Row header = sheet.createRow(0);
        header.createCell(0).setCellValue("ID");
        header.createCell(1).setCellValue("Espacio");
        header.createCell(2).setCellValue("Solicitante");
        header.createCell(3).setCellValue("Tipo de Evento");
        header.createCell(4).setCellValue("Inicio");
        header.createCell(5).setCellValue("Fin");
        header.createCell(6).setCellValue("Estado");
        int rowIdx = 1;
        for (Booking b : bookings) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(b.getId());
            row.createCell(1).setCellValue(b.getPlace() != null ? b.getPlace().getName() : "");
            row.createCell(2).setCellValue(b.getBookingRequest() != null && b.getBookingRequest().getUser() != null ? b.getBookingRequest().getUser().getFullName() : "");
            row.createCell(3).setCellValue(b.getBookingRequest() != null && b.getBookingRequest().getActivityType() != null ? b.getBookingRequest().getActivityType().name() : "OTROS");
            row.createCell(4).setCellValue(b.getStartTime() != null ? b.getStartTime().toString() : "");
            row.createCell(5).setCellValue(b.getEndTime() != null ? b.getEndTime().toString() : "");
            row.createCell(6).setCellValue(b.getStatus() != null ? b.getStatus().name() : "");
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.close();
        return out.toByteArray();
    }
}

