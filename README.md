id | descripcion
----+---------------------------------------
1 | Usuario rostro no detectado en camara
2 | Usuario salio de pestana
3 | Usuario salio de pantalla completa

## Por hacer

- En N cantidad de eventos finalizar la prueba
- Refinar proceso de finalizacion, se debe redirigir o apagar camara y pantalla compartida
- Agregar middleware para saber si test acabo
- Forzar a tener 1 sola pestana?
- Close webcam cambia el estado de Camara en Panel
- Si salgo de pantalla completa no hay boton que lo recupere, aunque si es correcto que se realice solo un registro de ese evento y no en loop hasta que se recupere
- Quiza: agregar un bucket 'rostros' que se encargue solo almacen de rostros. Requiere refactorizacion de codigo
