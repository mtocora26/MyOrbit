package com.app.myorbit.shared.config;

import com.app.myorbit.habits.domain.HabitFrequency;
import com.app.myorbit.tasks.domain.Priority;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.data.convert.WritingConverter;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;

import java.util.List;

/**
 * Los enums se guardan en Mongo con su valor de negocio ("alta", "diaria"), no con su nombre,
 * para no migrar los documentos existentes.
 */
@Configuration
public class MongoConversionConfig {
    @Bean
    public MongoCustomConversions mongoCustomConversions() {
        return new MongoCustomConversions(List.of(
                new PriorityWriter(), new PriorityReader(),
                new HabitFrequencyWriter(), new HabitFrequencyReader()));
    }

    @WritingConverter
    static class PriorityWriter implements Converter<Priority, String> {
        @Override
        public String convert(Priority source) {
            return source.value();
        }
    }

    /** Un valor desconocido en la base no debe impedir leer la tarea. */
    @ReadingConverter
    static class PriorityReader implements Converter<String, Priority> {
        @Override
        public Priority convert(String source) {
            return Priority.fromValue(source).orElse(Priority.MEDIUM);
        }
    }

    @WritingConverter
    static class HabitFrequencyWriter implements Converter<HabitFrequency, String> {
        @Override
        public String convert(HabitFrequency source) {
            return source.value();
        }
    }

    @ReadingConverter
    static class HabitFrequencyReader implements Converter<String, HabitFrequency> {
        @Override
        public HabitFrequency convert(String source) {
            return HabitFrequency.fromValue(source).orElse(HabitFrequency.DAILY);
        }
    }
}
