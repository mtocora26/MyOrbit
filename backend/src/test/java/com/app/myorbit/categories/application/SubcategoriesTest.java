package com.app.myorbit.categories.application;

import com.app.myorbit.categories.api.CreateCategoryRequest;
import com.app.myorbit.categories.api.UpdateCategoryRequest;
import com.app.myorbit.categories.domain.Category;
import com.app.myorbit.categories.domain.CategoryDeletedEvent;
import com.app.myorbit.categories.infrastructure.CategoryRepository;
import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyIterable;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** La jerarquía de un nivel, contra un repositorio en memoria para ejercitar la lógica real de padres e hijas. */
class SubcategoriesTest {
    private final List<Category> store = new ArrayList<>();
    private final CategoryRepository repository = mock(CategoryRepository.class);
    private final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
    private final CategoryService service = new CategoryService(repository, events);

    @BeforeEach
    void inMemoryRepository() {
        when(repository.findById(anyString())).thenAnswer(call -> store.stream().filter(c -> c.getId().equals(call.getArgument(0))).findFirst());
        when(repository.findByUserIdOrderByNameAsc(anyString())).thenAnswer(call -> store.stream()
                .filter(c -> c.getUserId().equals(call.getArgument(0))).sorted(Comparator.comparing(Category::getName)).toList());
        when(repository.findByUserIdAndParentId(anyString(), anyString())).thenAnswer(call -> store.stream()
                .filter(c -> c.getUserId().equals(call.getArgument(0)) && call.getArgument(1).equals(c.getParentId())).toList());
        when(repository.save(any(Category.class))).thenAnswer(call -> {
            Category category = call.getArgument(0);
            store.removeIf(c -> c.getId().equals(category.getId()));
            store.add(category);
            return category;
        });
        when(repository.saveAll(anyIterable())).thenAnswer(call -> {
            Iterable<Category> all = call.getArgument(0);
            all.forEach(category -> { store.removeIf(c -> c.getId().equals(category.getId())); store.add(category); });
            return all;
        });
        org.mockito.Mockito.doAnswer(call -> { store.removeIf(c -> c.getId().equals(call.getArgument(0))); return null; })
                .when(repository).deleteById(anyString());
    }

    private Category root(String id, String name) {
        return add(id, "u1", name, null);
    }

    private Category child(String id, String name, String parentId) {
        return add(id, "u1", name, parentId);
    }

    private Category add(String id, String userId, String name, String parentId) {
        Category category = new Category();
        category.setId(id);
        category.setUserId(userId);
        category.setName(name);
        category.setColor("#7A5AF8");
        category.setParentId(parentId);
        store.add(category);
        return category;
    }

    private Category byId(String id) {
        return store.stream().filter(c -> c.getId().equals(id)).findFirst().orElseThrow();
    }

    // ---------- crear ----------

    @Test
    void createsASubcategoryUnderARootInheritingItsColor() {
        root("uni", "Universidad");

        Category created = service.create("u1", new CreateCategoryRequest("Semillero", null, "uni"));

        assertEquals("uni", created.getParentId());
        assertEquals("#7A5AF8", created.getColor());
        assertEquals("Semillero", created.getName());
    }

    @Test
    void aSubcategoryKeepsItsOwnColorWhenGiven() {
        root("uni", "Universidad");

        assertEquals("#12B76A", service.create("u1", new CreateCategoryRequest("Semillero", "#12B76A", "uni")).getColor());
    }

    @Test
    void withoutParentItIsARoot() {
        assertNull(service.create("u1", new CreateCategoryRequest("Personal", "#12B76A")).getParentId());
        assertNull(service.create("u1", new CreateCategoryRequest("Casa", "#12B76A", "  ")).getParentId());
    }

    @Test
    void onlyOneLevelOfSubcategories() {
        root("uni", "Universidad");
        child("sem", "Semillero", "uni");

        BusinessRuleException error = assertThrows(BusinessRuleException.class,
                () -> service.create("u1", new CreateCategoryRequest("Reuniones", null, "sem")));

        assertTrue(error.getMessage().contains("un nivel"));
    }

    @Test
    void theParentMustExistAndBelongToTheUser() {
        add("ajena", "u2", "Universidad", null);

        assertThrows(NotFoundException.class, () -> service.create("u1", new CreateCategoryRequest("Semillero", null, "ajena")));
        assertThrows(NotFoundException.class, () -> service.create("u1", new CreateCategoryRequest("Semillero", null, "no-existe")));
    }

    @Test
    void nameIsUniqueAmongSiblingsButCanRepeatUnderAnotherParent() {
        root("uni", "Universidad");
        root("per", "Personal");
        child("sem", "Semillero", "uni");

        assertThrows(BusinessRuleException.class, () -> service.create("u1", new CreateCategoryRequest("semillero", null, "uni")));
        // Mismo nombre bajo otro padre: permitido.
        assertEquals("per", service.create("u1", new CreateCategoryRequest("Semillero", null, "per")).getParentId());
    }

    @Test
    void aSubcategoryMayShareANameWithARootButRootsStayUnique() {
        root("uni", "Universidad");
        root("proy", "Proyecto");

        assertEquals("uni", service.create("u1", new CreateCategoryRequest("Proyecto", null, "uni")).getParentId());
        assertThrows(BusinessRuleException.class, () -> service.create("u1", new CreateCategoryRequest("proyecto", null)));
    }

    // ---------- editar ----------

    @Test
    void renamingASubcategoryWithoutParentIdKeepsItsParent() {
        root("uni", "Universidad");
        child("sem", "Semillero", "uni");

        Category updated = service.update("u1", "sem", new UpdateCategoryRequest("Semillero IA", null));

        assertEquals("uni", updated.getParentId());
        assertEquals("Semillero IA", updated.getName());
    }

    @Test
    void emptyParentIdTurnsASubcategoryIntoARoot() {
        root("uni", "Universidad");
        child("sem", "Semillero", "uni");

        assertNull(service.update("u1", "sem", new UpdateCategoryRequest("Semillero", null, "")).getParentId());
    }

    @Test
    void aSubcategoryCanMoveToAnotherRoot() {
        root("uni", "Universidad");
        root("per", "Personal");
        child("sem", "Semillero", "uni");

        assertEquals("per", service.update("u1", "sem", new UpdateCategoryRequest("Semillero", null, "per")).getParentId());
    }

    @Test
    void aRootCanBecomeASubcategoryWhenItHasNoChildren() {
        root("uni", "Universidad");
        root("sem", "Semillero");

        assertEquals("uni", service.update("u1", "sem", new UpdateCategoryRequest("Semillero", null, "uni")).getParentId());
    }

    @Test
    void aRootWithSubcategoriesCannotBecomeASubcategory() {
        root("uni", "Universidad");
        root("per", "Personal");
        child("sem", "Semillero", "uni");

        BusinessRuleException error = assertThrows(BusinessRuleException.class,
                () -> service.update("u1", "uni", new UpdateCategoryRequest("Universidad", null, "per")));

        assertTrue(error.getMessage().contains("subcategorias"));
        assertNull(byId("uni").getParentId());
    }

    @Test
    void aCategoryCannotBeItsOwnParentNorUnderASubcategory() {
        root("uni", "Universidad");
        root("per", "Personal");
        child("sem", "Semillero", "uni");

        assertThrows(BusinessRuleException.class, () -> service.update("u1", "uni", new UpdateCategoryRequest("Universidad", null, "uni")));
        assertThrows(BusinessRuleException.class, () -> service.update("u1", "per", new UpdateCategoryRequest("Personal", null, "sem")));
    }

    @Test
    void movingIsRefusedWhenTheNameClashesWithTheNewSiblings() {
        root("uni", "Universidad");
        root("per", "Personal");
        child("sem1", "Semillero", "uni");
        child("sem2", "Semillero", "per");

        assertThrows(BusinessRuleException.class, () -> service.update("u1", "sem1", new UpdateCategoryRequest("Semillero", null, "per")));
        assertEquals("uni", byId("sem1").getParentId());
    }

    // ---------- eliminar ----------

    @Test
    void deletingAParentPromotesItsSubcategoriesToRoots() {
        root("uni", "Universidad");
        child("sem", "Semillero", "uni");
        child("rep", "Reuniones", "uni");

        service.delete("u1", "uni");

        assertTrue(store.stream().noneMatch(c -> c.getId().equals("uni")));
        assertNull(byId("sem").getParentId());
        assertNull(byId("rep").getParentId());
        assertEquals("Semillero", byId("sem").getName());
    }

    @Test
    void promotedSubcategoriesAreRenamedWhenTheirNameClashesWithARoot() {
        root("uni", "Universidad");
        root("sem-root", "Semillero");
        child("sem", "Semillero", "uni");

        service.delete("u1", "uni");

        assertEquals("Universidad › Semillero", byId("sem").getName());
        assertNull(byId("sem").getParentId());
        assertEquals("Semillero", byId("sem-root").getName());
    }

    @Test
    void renamedPromotionsNeverClashAmongThemselves() {
        root("uni", "Universidad");
        root("per", "Personal");
        root("sem-root", "Semillero");
        root("uni-sem", "Universidad › Semillero");
        child("a", "Semillero", "uni");

        service.delete("u1", "uni");

        assertEquals("Universidad › Semillero (2)", byId("a").getName());
    }

    @Test
    void promotedNamesStayWithinTheMaximumLength() {
        String longParent = "P".repeat(45);
        root("p", longParent);
        root("existing", "Hija larga");
        child("h", "Hija larga", "p");

        service.delete("u1", "p");

        assertEquals(CategoryService.MAX_NAME, byId("h").getName().length());
    }

    @Test
    void deletingASubcategoryOnlyAffectsItselfAndPublishesItsOwnEvent() {
        root("uni", "Universidad");
        child("sem", "Semillero", "uni");

        service.delete("u1", "sem");

        assertTrue(store.stream().anyMatch(c -> c.getId().equals("uni")));
        ArgumentCaptor<CategoryDeletedEvent> event = ArgumentCaptor.forClass(CategoryDeletedEvent.class);
        verify(events).publishEvent(event.capture());
        assertEquals("sem", event.getValue().categoryId());
    }

    @Test
    void deletingAParentOnlyPublishesTheParentEventSoTheSubcategoryTasksSurvive() {
        root("uni", "Universidad");
        child("sem", "Semillero", "uni");

        service.delete("u1", "uni");

        ArgumentCaptor<CategoryDeletedEvent> event = ArgumentCaptor.forClass(CategoryDeletedEvent.class);
        verify(events).publishEvent(event.capture());
        assertEquals("uni", event.getValue().categoryId());
    }

    @Test
    void findRootByNameIgnoresCaseAndSkipsSubcategories() {
        root("uni", "Universidad");
        root("per", "Personal");
        child("x", "universidad", "per");

        assertEquals("uni", service.findRootByName("u1", "UNIVERSIDAD").orElseThrow().getId());
        assertTrue(service.findRootByName("u1", "Proyecto").isEmpty());
        // Solo cuenta una raíz: una subcategoría con ese nombre no.
        store.removeIf(c -> c.getId().equals("uni"));
        assertTrue(service.findRootByName("u1", "Universidad").isEmpty());
    }

    // ---------- filtro ----------

    @Test
    void withSubcategoriesReturnsTheCategoryAndItsChildren() {
        root("uni", "Universidad");
        child("sem", "Semillero", "uni");
        child("rep", "Reuniones", "uni");
        root("per", "Personal");

        assertEquals(Set.of("uni", "sem", "rep"), service.withSubcategories("u1", "uni"));
        assertEquals(Set.of("per"), service.withSubcategories("u1", "per"));
        assertEquals(Set.of("sem"), service.withSubcategories("u1", "sem"));
    }
}
