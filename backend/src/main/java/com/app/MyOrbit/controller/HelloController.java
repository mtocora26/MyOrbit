package com.app.MyOrbit.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@CrossOrigin(origins = "*")
public class HelloController {

    @GetMapping("/api/saludo")
    public String saludo() {
        return "Hola, MyOrbit API en funcionamiento";
    }

    @GetMapping("/")
    public String paginaPrincipal(){
        return "Hola, esta es la pagina principal";
    }

    @GetMapping("/api/saludo-personal")
    public String saludoPersonal(@RequestParam(defaultValue = "estudiante") String nombre) {
    return "Hola, " + nombre + ". Bienvenido a MyOrbit API";
    }
}