package com.app.myorbit.shared.config;

import com.app.myorbit.habits.domain.Habit;
import com.app.myorbit.habits.domain.HabitFrequency;
import com.app.myorbit.tasks.api.CreateTaskRequest;
import com.app.myorbit.tasks.domain.Priority;
import com.app.myorbit.tasks.domain.Task;
import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;
import org.springframework.data.mongodb.core.convert.NoOpDbRefResolver;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;
import tools.jackson.databind.DatabindException;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class MongoConversionConfigTest {
    private MappingMongoConverter converter;

    @BeforeEach
    void setUp() {
        MongoCustomConversions conversions = new MongoConversionConfig().mongoCustomConversions();
        MongoMappingContext context = new MongoMappingContext();
        context.setSimpleTypeHolder(conversions.getSimpleTypeHolder());
        context.afterPropertiesSet();
        converter = new MappingMongoConverter(NoOpDbRefResolver.INSTANCE, context);
        converter.setCustomConversions(conversions);
        converter.afterPropertiesSet();
    }

    @Test
    void storesPriorityWithItsBusinessValue() {
        Task task = new Task();
        task.setId("t1");
        task.setPriority(Priority.HIGH);

        Document document = new Document();
        converter.write(task, document);

        assertEquals("alta", document.get("priority"));
    }

    @Test
    void readsExistingDocumentsWithoutMigration() {
        Task task = converter.read(Task.class, new Document("_id", "t1").append("priority", "baja"));

        assertEquals(Priority.LOW, task.getPriority());
    }

    @Test
    void unknownStoredValueFallsBackToDefault() {
        Task task = converter.read(Task.class, new Document("_id", "t1").append("priority", "urgente"));

        assertEquals(Priority.MEDIUM, task.getPriority());
    }

    @Test
    void storesAndReadsHabitFrequency() {
        Habit habit = new Habit();
        habit.setId("h1");
        habit.setFrequency(HabitFrequency.CUSTOM);

        Document document = new Document();
        converter.write(habit, document);

        assertEquals("personalizada", document.get("frequency"));
        assertEquals(HabitFrequency.CUSTOM, converter.read(Habit.class, document).getFrequency());
    }

    @Test
    void apiAcceptsBusinessValuesAndRejectsInvalidOnes()  {
        ObjectMapper mapper = JsonMapper.builder().build();

        CreateTaskRequest ok = mapper.readValue("{\"title\":\"x\",\"priority\":\"alta\"}", CreateTaskRequest.class);
        assertEquals(Priority.HIGH, ok.priority());
        assertThrows(DatabindException.class,
                () -> mapper.readValue("{\"title\":\"x\",\"priority\":\"urgente\"}", CreateTaskRequest.class));
        assertEquals("\"alta\"", mapper.writeValueAsString(Priority.HIGH));
    }
}
