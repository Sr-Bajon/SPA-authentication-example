#Autenticación y gestión de usuarios en paginas SPA (single page application) con AngularJS y NodeJS

La aplicación de ejemplo consta de una primera pagina para hacer login.

Hay dos tipos de usuarios, administrador y usuario, el administrador podrá 
navegar a una pagina que estará restringida al usuario sin permisos.

No es posible hacer una SPA con gestion de usuarios puesto que como todas las 
tareas de navegación entre paginas recaen en el frontend sería facilmente posible 
saltarse las restricciones manipulando el codigo javascript.

Por ello, cuando se trate de distintos usuarios con permisos diferentes, deberiamos
instanciar un nuevo modulo (en el caso de AngularJS), siendo el servidor el responsable
de servir la pagina restringida, y no la aplicación del lado del cliente.

De todas formas en este primer ejemplo, usaremos una SPA pura, sin recargas de 
paginas, dependiendo de la aplicacion y lo segura que queramos que sea podemos 
querer hacerla así.
