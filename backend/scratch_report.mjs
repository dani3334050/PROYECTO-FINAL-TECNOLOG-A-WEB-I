import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const img1Path = 'C:/Users/danie/.gemini/antigravity/brain/e4d8fe69-b697-4555-bc83-ec7613edc73c/.user_uploaded/media_1795570108507_b9ccee43.png';
const img2Path = 'C:/Users/danie/.gemini/antigravity/brain/e4d8fe69-b697-4555-bc83-ec7613edc73c/.user_uploaded/media_1795567364149_4edf5a87.png';
const img3Path = 'C:/Users/danie/.gemini/antigravity/brain/e4d8fe69-b697-4555-bc83-ec7613edc73c/.user_uploaded/media_1795568394199_e9874941.png';

const getBase64 = (filePath) => {
  if (fs.existsSync(filePath)) {
    return `data:image/png;base64,${fs.readFileSync(filePath).toString('base64')}`;
  }
  return '';
};

const imgMainBase64 = getBase64(img1Path);
const imgDiag1Base64 = getBase64(img2Path);
const imgDiag2Base64 = getBase64(img3Path);

const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Informe Académico - Ubuntu Server RUTABOL-SCZ</title>
  <style>
    @page {
      size: letter;
      margin: 2.54cm;
      @top-right {
        content: counter(page);
        font-family: 'Times New Roman', serif;
        font-size: 10pt;
      }
    }
    
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.45;
      color: #111827;
      margin: 0;
      padding: 0;
    }

    .page-break {
      page-break-after: always;
    }

    /* Portada APA 7 */
    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      text-align: center;
      padding-top: 40px;
    }

    .cover-title {
      font-size: 15pt;
      font-weight: bold;
      margin-bottom: 40px;
      line-height: 1.35;
      max-width: 650px;
    }

    .cover-meta {
      font-size: 11.5pt;
      line-height: 1.9;
      margin-top: 30px;
    }

    .cover-meta strong {
      font-weight: bold;
    }

    /* Encabezados APA 7 */
    h1 {
      font-size: 13pt;
      font-weight: bold;
      text-align: center;
      margin-top: 18px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }

    h2 {
      font-size: 11.5pt;
      font-weight: bold;
      text-align: left;
      margin-top: 14px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }

    h3 {
      font-size: 10.5pt;
      font-weight: bold;
      font-style: italic;
      text-align: left;
      margin-top: 12px;
      margin-bottom: 6px;
      page-break-after: avoid;
    }

    p {
      text-align: justify;
      margin-bottom: 10px;
      text-indent: 1.27cm;
    }

    .no-indent {
      text-indent: 0 !important;
    }

    /* Tablas APA 7 */
    .table-container {
      margin: 16px 0;
      page-break-inside: avoid;
    }

    .table-number {
      font-weight: bold;
      margin-bottom: 2px;
    }

    .table-title {
      font-style: italic;
      margin-bottom: 6px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
      margin-bottom: 4px;
    }

    th {
      border-top: 1.5pt solid #000;
      border-bottom: 1pt solid #000;
      padding: 5px 7px;
      text-align: left;
      font-weight: bold;
    }

    td {
      padding: 5px 7px;
      text-align: left;
      border: none;
    }

    tr:last-child td {
      border-bottom: 1.5pt solid #000;
    }

    .table-note {
      font-size: 8.5pt;
      font-style: normal;
      margin-top: 3px;
    }

    .table-note strong {
      font-style: italic;
    }

    /* Figuras APA 7 */
    .figure-container {
      margin: 16px 0;
      text-align: left;
      page-break-inside: avoid;
    }

    .figure-number {
      font-weight: bold;
      margin-bottom: 2px;
    }

    .figure-title {
      font-style: italic;
      margin-bottom: 6px;
    }

    .figure-image-wrapper {
      text-align: center;
      background: #000;
      border-radius: 4px;
      padding: 3px;
      margin-bottom: 4px;
    }

    .figure-image {
      max-width: 98%;
      height: auto;
      border-radius: 2px;
      display: block;
      margin: 0 auto;
    }

    .figure-note {
      font-size: 8.5pt;
      margin-top: 3px;
      text-align: justify;
    }

    .figure-note strong {
      font-style: italic;
    }

    /* Bloques de Código Terminal */
    .terminal-box {
      background-color: #0f172a;
      color: #f8fafc;
      font-family: 'Courier New', Courier, monospace;
      font-size: 8.5pt;
      padding: 8px 12px;
      border-radius: 6px;
      margin: 10px 0;
      line-height: 1.3;
      page-break-inside: avoid;
      border-left: 3pt solid #0284c7;
    }

    .terminal-cmd {
      color: #38bdf8;
      font-weight: bold;
    }

    .terminal-out {
      color: #94a3b8;
    }

    .terminal-success {
      color: #34d399;
    }

    /* Referencias APA 7 */
    .reference-item {
      padding-left: 1.27cm;
      text-indent: -1.27cm;
      margin-bottom: 8px;
      text-align: justify;
      font-size: 9.5pt;
    }
  </style>
</head>
<body>

  <!-- PORTADA OFICIAL APA 7 -->
  <div class="cover-page">
    <div style="font-size: 12pt; font-weight: bold; text-transform: uppercase; margin-bottom: 30px; letter-spacing: 1px;">
      Universidad Privada Domingo Savio<br>
      Facultad de Ingeniería<br>
      Carrera de Ingeniería de Sistemas
    </div>

    <div class="cover-title">
      Despliegue, Configuración Inicial y Administración Remota de Infraestructura Ubuntu Server para el Ecosistema RUTABOL-SCZ
    </div>

    <div class="cover-meta">
      <strong>Estudiante:</strong> Daniel Frias Vargas<br>
      <strong>Materia:</strong> Tecnología Web I / Desarrollo Web I<br>
      <strong>Proyecto Socioformativo:</strong> Sistema de Gestión y Rastreo de Flota Urbana RUTABOL-SCZ<br>
      <strong>Docente de la Asignatura:</strong> M.Sc. Ing. de la Asignatura<br>
      <strong>Sede Académica:</strong> Santa Cruz de la Sierra, Bolivia<br>
      <strong>Fecha de Entrega:</strong> 24 de Noviembre de 2026
    </div>
  </div>

  <div class="page-break"></div>

  <!-- SECCIÓN 1: INTRODUCCIÓN Y OBJETIVOS -->
  <h1>1. Introducción y Justificación Técnica</h1>
  <p>
    En la era moderna de las aplicaciones distribuidas, la gestión de servicios y la infraestructura de servidores constituyen el pilar fundamental que garantiza la alta disponibilidad, confiabilidad y seguridad de cualquier plataforma tecnológica. En el marco del proyecto socioformativo <strong>RUTABOL-SCZ</strong>, cuyo propósito principal es optimizar y digitalizar el sistema de transporte público urbano en la ciudad de Santa Cruz de la Sierra mediante la telemetría vehicular en tiempo real y el control de aforo para conductores y estudiantes, se requiere una arquitectura de backend robusta, aislada y de alto rendimiento.
  </p>
  <p>
    Los servidores que sustentan la persistencia en bases de datos relacionales (SQLite y futuras migraciones a PostgreSQL), el procesamiento de peticiones API REST y la transmisión instantánea de coordenadas GPS mediante WebSockets (Socket.io) no deben ejecutarse en estaciones de trabajo convencionales con sobrecarga gráfica de escritorio, sino en entornos optimizados de tipo <strong>Ubuntu Server</strong>. El uso de sistemas operativos tipo servidor permite minimizar el consumo de memoria RAM y procesador, maximizar la seguridad perimetral cerrando puertos innecesarios y habilitar canales de administración remota cifrados mediante <strong>OpenSSH</strong> bajo la supervisión de gestores de servicios avanzados como <strong>Systemd (systemctl)</strong>.
  </p>
  <p>
    La presente práctica de laboratorio tiene como <strong>Objetivo General</strong> instalar, aprovisionar y verificar un entorno operativo Ubuntu Server mediante una máquina virtualizada sobre Oracle VM VirtualBox, configurando las políticas de red, usuarios de servicio bajo el Principio de Menor Privilegio, la habilitación del servicio OpenSSH Server y la validación de la conectividad remota bidireccional desde el equipo anfitrión.
  </p>
  <p>
    Como <strong>Objetivos Específicos</strong> se establecen:
  </p>
  <ul style="margin-left: 2cm; margin-bottom: 14px; font-size: 11pt;">
    <li>Desplegar una máquina virtual Linux en arquitectura x86_64 con asignación controlada de recursos de cómputo y red NAT.</li>
    <li>Efectuar la configuración de identidad institucional (hostname <code>rutabol-server</code>) y solucionar contingencias de red relacionadas con proxies y sincronización temporal del sistema.</li>
    <li>Crear la cuenta de trabajo del sistema <code>operador</code> y estructurar el directorio de despliegue <code>/srv/rutabol</code> con permisos Unix rigurosos.</li>
    <li>Instalar, inicializar y validar el daemon OpenSSH Server comprobando su persistencia en el arranque y los sockets de escucha en el puerto TCP 22.</li>
    <li>Establecer una sesión de conexión remota interactiva SSH desde el entorno anfitrión Windows PowerShell mediante redirección de puertos NAT (Port Forwarding), documentando el procedimiento de verificación.</li>
  </ul>

  <!-- SECCIÓN 2: INFRAESTRUCTURA DE VIRTUALIZACIÓN -->
  <h2>2. Infraestructura y Parámetros de la Máquina Virtual</h2>
  <p>
    Para el desarrollo de la práctica se seleccionó el hipervisor de tipo 2 <strong>Oracle VM VirtualBox</strong> ejecutándose sobre el sistema operativo anfitrión Microsoft Windows 11. La máquina virtual, denominada técnicamente <code>Proyecto_Daniel</code>, fue aprovisionada siguiendo las especificaciones del manual de laboratorio para garantizar una ejecución fluida de los procesos sin comprometer la memoria del host.
  </p>

  <div class="table-container">
    <div class="table-number">Tabla 1</div>
    <div class="table-title">Especificaciones Técnicas y Parámetros de la Máquina Virtual en VirtualBox</div>
    <table>
      <thead>
        <tr>
          <th>Componente</th>
          <th>Especificación de la Máquina Virtual</th>
          <th>Justificación en RUTABOL-SCZ</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Hipervisor</td>
          <td>Oracle VM VirtualBox Versión 7.x</td>
          <td>Virtualización tipo 2 estandarizada y multiplataforma.</td>
        </tr>
        <tr>
          <td>Sistema Operativo</td>
          <td>Ubuntu Server 24.04 / 26.04 LTS (x86_64)</td>
          <td>Entorno headless de soporte extendido (LTS) sin entorno gráfico.</td>
        </tr>
        <tr>
          <td>Procesadores (vCPU)</td>
          <td>2 Núcleos Virtuales de Cómputo</td>
          <td>Capacidad multinúcleo para eventos I/O y WebSockets en tiempo real.</td>
        </tr>
        <tr>
          <td>Memoria Asignada</td>
          <td>9,940 MB RAM (DDR4)</td>
          <td>Memoria dedicada holgada para Node.js, SQLite y microservicios.</td>
        </tr>
        <tr>
          <td>Almacenamiento</td>
          <td>Disco Virtual VDI Dinámico (30 GB)</td>
          <td>Espacio para sistema base, paquetes, logs del sistema y base de datos.</td>
        </tr>
        <tr>
          <td>Controlador de Red</td>
          <td>Adaptador 1: NAT (Intel PRO/1000 MT Desktop)</td>
          <td>Aislamiento de red con acceso seguro y transparente hacia Internet.</td>
        </tr>
        <tr>
          <td>Redirección de Puertos</td>
          <td>Host 127.0.0.1:2222 &rarr; Invitado VM:22 (TCP)</td>
          <td>Túnel que permite conexión SSH directa desde Windows hacia la VM.</td>
        </tr>
      </tbody>
    </table>
    <div class="table-note"><strong>Nota.</strong> Configuración verificada mediante VBoxManage y consola de VirtualBox.</div>
  </div>

  <div class="page-break"></div>

  <!-- SECCIÓN 3: METODOLOGÍA Y EVIDENCIAS DE LABORATORIO -->
  <h1>3. Metodología, Procedimiento y Evidencias de Laboratorio</h1>
  <p>
    A continuación se documentan de forma cronológica las cinco actividades esenciales exigidas por el manual de laboratorio institucional y la rúbrica de evaluación docente, incluyendo el diagnóstico técnico de las contingencias presentadas y las evidencias fotográficas de ejecución.
  </p>

  <h2>3.1. Evidencia E1: Instalación del Servidor e Identidad del Sistema</h2>
  <p>
    Tras concluir el asistente de instalación de Ubuntu Server, se verificó el arranque en modo texto y la arquitectura del kernel. Mediante el comando <code>uname -m</code> se certificó la ejecución sobre una plataforma <code>x86_64</code> (AMD64). Posteriormente, se estableció la identidad institucional del servidor asignándole el nombre canónico <code>rutabol-server</code> mediante la utilidad <code>hostnamectl</code>:
  </p>

  <div class="terminal-box">
    <span class="terminal-cmd">daniel@daniel:~$</span> sudo hostnamectl set-hostname rutabol-server<br>
    <span class="terminal-cmd">daniel@rutabol-server:~$</span> uname -m<br>
    <span class="terminal-out">x86_64</span><br>
    <span class="terminal-cmd">daniel@rutabol-server:~$</span> hostnamectl<br>
    <span class="terminal-out"> Static hostname: rutabol-server<br>
       Icon name: computer-vm<br>
         Chassis: vm<br>
      Machine ID: a14010c72a61412d8102d848a84ce7a0<br>
  Operating System: Ubuntu 26.04.1 LTS<br>
            Kernel: Linux 7.0.0-44-generic<br>
      Architecture: x86-64</span>
  </div>

  <h2>3.2. Evidencia E2: Conectividad de Red y Resolución de Incidencias</h2>
  <p>
    Se comprobó la configuración del direccionamiento IP asignado dinámicamente por el servicio DHCP del hipervisor en la interfaz de red virtual <code>enp0s3</code> mediante <code>ip -br a</code>, obteniendo la dirección IPv4 privada <code>10.0.2.15/24</code> con puerta de enlace predeterminada <code>10.0.2.2</code>. Las pruebas de enlace ICMP hacia los servidores DNS globales (<code>1.1.1.1</code>) y el dominio oficial de Ubuntu (<code>ubuntu.com</code>) respondieron exitosamente con 0% de pérdida de paquetes.
  </p>

  <h3>Diagnóstico Técnico de Contingencias (Error HTTP 403 y Desfase de Reloj)</h3>
  <p>
    Durante la ejecución inicial del comando <code>sudo apt update</code> se presentaron dos dificultades técnicas que fueron diagnosticadas y resueltas satisfactoriamente, constituyendo evidencia de rigor metodológico:
  </p>
  <ul style="margin-left: 2cm; margin-bottom: 12px; font-size: 10.5pt;">
    <li><strong>Incidencia 1 (Error 403 Forbidden):</strong> Los repositorios configurados por omisión apuntaban a servidores HTTP sin cifrar (<code>http://bo.archive.ubuntu.com</code>), los cuales eran bloqueados por políticas de filtrado y proxies transparentes del proveedor de red local. <em>Solución:</em> Se aplicó una sustitución con <code>sed</code> para migrar todos los repositorios en <code>/etc/apt/sources.list.d/ubuntu.sources</code> hacia HTTPS cifrado (puerto 443) apuntando a los servidores principales de <code>archive.ubuntu.com</code>.</li>
    <li><strong>Incidencia 2 (Invalidez Temporal de Archivos Release):</strong> El reloj de hardware de la máquina virtual presentaba un retraso de más de dos horas con relación a la hora real de los servidores de réplica. El gestor APT bloqueó la actualización indicando que los archivos de publicación pertenecían al futuro. <em>Solución:</em> Se configuró la zona horaria oficial <code>America/La_Paz</code>, se ajustó la hora exacta del sistema con <code>sudo date -s "2026-11-24 21:13:00"</code> y se sincronizó el reloj de hardware con <code>sudo hwclock --systohc</code>.</li>
  </ul>
  <p>
    Tras la aplicación de ambas soluciones, el comando <code>sudo apt update</code> procesó las 20 fuentes de repositorios sin errores de integridad, permitiendo la indexación de paquetes del sistema.
  </p>

  <div class="page-break"></div>

  <h2>3.3. Evidencias E3, E4 y E5: Usuarios, OpenSSH y Conexión Remota</h2>
  <p>
    En cumplimiento con las directivas de seguridad para el despliegue del software RUTABOL-SCZ, se ejecutaron las tres fases operativas finales:
  </p>
  <p>
    <strong>Aprovisionamiento del Usuario y Directorio (E3):</strong> Se creó la cuenta de usuario de servicio <code>operador</code> (UID: 1001, GID: 1001) para aislar la ejecución de la aplicación web y evitar el uso indebido de privilegios <code>root</code>. Se creó el directorio de despliegue institucional <code>/srv/rutabol</code> y se transfirió la titularidad completa mediante <code>sudo chown operador:operador /srv/rutabol</code>, validando permisos de lectura, escritura y ejecución controlada (<code>drwxr-xr-x</code>).
  </p>
  <p>
    <strong>Gestión del Servicio OpenSSH (E4):</strong> Se verificó la instalación del paquete <code>openssh-server</code> y se habilitó su arranque automático persistente ante reinicios del servidor mediante <code>sudo systemctl enable --now ssh</code>. A través del comando <code>systemctl status ssh --no-pager</code> se comprobó el estado <code>active (running)</code> con el proceso principal <code>sshd</code> en el PID 1056. Asimismo, la inspección de puertos con <code>sudo ss -tlnp | grep :22</code> certificó que el servidor se encuentra escuchando peticiones en los sockets TCP <code>0.0.0.0:22</code> e <code>[::]:22</code>.
  </p>
  <p>
    <strong>Conexión Remota SSH desde Windows (E5):</strong> Desde una ventana de PowerShell en el equipo anfitrión se estableció la conexión remota apuntando al puerto redireccionado: <code>ssh -p 2222 operador@127.0.0.1</code>. Se autenticó la clave pública ED25519 del servidor, se validó la sesión y se ejecutaron los comandos de auditoría <code>whoami</code> (confirmando la identidad <code>operador</code>), <code>hostname</code> (<code>rutabol-server</code>) y <code>pwd</code> (<code>/home/operador</code>).
  </p>

  <div class="figure-container">
    <div class="figure-number">Figura 1</div>
    <div class="figure-title">Evidencias E3, E4 y E5: Configuración de Usuario, Estado de OpenSSH y Conexión Remota SSH</div>
    <div class="figure-image-wrapper">
      <img src="${imgMainBase64}" class="figure-image" alt="Evidencia E3, E4 y E5 en pantalla dividida">
    </div>
    <div class="figure-note">
      <strong>Nota.</strong> A la izquierda se observa la consola de la máquina virtual Ubuntu Server ejecutando los comandos de creación del usuario <code>operador</code>, permisos en <code>/srv/rutabol</code>, el estado activo y habilitado del daemon <code>ssh.service</code> y la escucha del socket en el puerto 22. A la derecha se aprecia la ventana de Windows Terminal conectada remotamente vía SSH confirmando el acceso de administración segura.
    </div>
  </div>

  <div class="figure-container">
    <div class="figure-number">Figura 2</div>
    <div class="figure-title">Evidencia de Diagnóstico y Mitigación: Superación del Error 403 y Descarga Cifrada de Repositorios</div>
    <div class="figure-image-wrapper">
      <img src="${imgDiag1Base64}" class="figure-image" alt="Diagnóstico de red y resolución de repositorios">
    </div>
    <div class="figure-note">
      <strong>Nota.</strong> Captura que documenta la presencia de conectividad inicial mediante <code>ping</code> hacia servidores externos, el bloqueo por proxy HTTP en repositorios no cifrados y la posterior descarga transparente sobre canales HTTPS.
    </div>
  </div>

  <div class="page-break"></div>

  <!-- SECCIÓN 4: INVESTIGACIÓN Y ANÁLISIS TÉCNICO -->
  <h1>4. Investigación y Análisis Técnico de Componentes</h1>
  <p>
    Para comprender la trascendencia de las herramientas utilizadas y su impacto en el ciclo de vida del sistema RUTABOL-SCZ, se presenta a continuación el análisis técnico de los tres componentes esenciales evaluados:
  </p>

  <h2>4.1. Función de Ubuntu Server en la Infraestructura de RUTABOL-SCZ</h2>
  <p>
    Ubuntu Server es una distribución de GNU/Linux orientada específicamente a la ejecución de servicios y microservicios empresariales. A diferencia de las versiones para estaciones de trabajo (Ubuntu Desktop), carece deliberadamente de interfaces gráficas (como GNOME o Wayland) y servidores de display. Esta arquitectura minimalista conocida como <em>headless</em> proporciona tres ventajas determinantes:
  </p>
  <ul style="margin-left: 2cm; margin-bottom: 12px; font-size: 10.5pt;">
    <li><strong>Eficiencia en Consumo de Recursos:</strong> Permite que prácticamente el 100% de la memoria RAM y el tiempo de CPU se destinen al procesamiento de eventos de telemetría de los microbuses de Santa Cruz, evitando que cientos de megabytes se desperdicien en renderizar ventanas gráficas.</li>
    <li><strong>Superficie de Ataque Reducida:</strong> Al no instalar paquetes innecesarios, se minimiza la cantidad de binarios y bibliotecas susceptibles a vulnerabilidades de seguridad conocidas (CVE).</li>
    <li><strong>Aislamiento de la Base de Datos:</strong> Provee el entorno idóneo para alojar de forma segura el motor de base de datos relacional <code>rutabol.db</code> (SQLite) y su API Express, permitiendo la lectura concurrente sin bloqueos de red externos.</li>
  </ul>

  <h2>4.2. OpenSSH Server como Canal Seguro de Operaciones</h2>
  <p>
    El protocolo OpenSSH (Open Secure Shell) sustituye de forma absoluta a protocolos heredados no seguros como Telnet (TCP 23) o Rlogin. Su diseño se fundamenta en un esquema criptográfico cliente-servidor que implementa autenticación basada en claves públicas (ED25519 / RSA) o contraseñas bajo canales cifrados mediante algoritmos como ChaCha20-Poly1305 o AES-256-GCM.
  </p>
  <p>
    En la gestión futura de RUTABOL-SCZ, OpenSSH permitirá a los administradores de la red desplegar actualizaciones de código, inspeccionar logs de transacciones de pasajes, ejecutar respaldos automáticos de la base de datos de la flota y monitorear la salud del servidor desde cualquier ubicación remota a través de túneles seguros y cifrados de extremo a extremo, sin exponer jamás las credenciales del sindicato en texto plano sobre redes públicas.
  </p>

  <h2>4.3. Administración del Ciclo de Vida de Servicios con Systemd (systemctl)</h2>
  <p>
    <code>systemd</code> es el sistema de inicialización y gestor de servicios estándar en las distribuciones Linux contemporáneas. El comando <code>systemctl</code> actúa como la interfaz de control primordial para supervisar los daemons (procesos en segundo plano). En la Tabla 2 se detallan las operaciones elementales de administración que gobernarán el servidor de RUTABOL-SCZ.
  </p>

  <div class="table-container">
    <div class="table-number">Tabla 2</div>
    <div class="table-title">Diferencias Operativas de los Comandos de Control de Servicios en systemctl</div>
    <table>
      <thead>
        <tr>
          <th>Comando de Control</th>
          <th>Efecto Técnico en el Sistema Operativo</th>
          <th>Aplicación Práctica en RUTABOL-SCZ</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>systemctl start &lt;srv&gt;</code></td>
          <td>Arranca el daemon en el espacio de memoria actual inmediatamente.</td>
          <td>Iniciar el servidor backend de la flota al arrancar manualmente.</td>
        </tr>
        <tr>
          <td><code>systemctl stop &lt;srv&gt;</code></td>
          <td>Envía señal SIGTERM/SIGKILL para detener el proceso en ejecución.</td>
          <td>Pausar el servicio durante una ventana de mantenimiento de base de datos.</td>
        </tr>
        <tr>
          <td><code>systemctl restart &lt;srv&gt;</code></td>
          <td>Finaliza el proceso activo y lanza una nueva instancia completa.</td>
          <td>Reiniciar el backend tras actualizar rutas o dependencias de Node.js.</td>
        </tr>
        <tr>
          <td><code>systemctl reload &lt;srv&gt;</code></td>
          <td>Envía señal SIGHUP para releer configuraciones sin cortar conexiones.</td>
          <td>Actualizar configuraciones de red o proxy sin desconectar a los choferes.</td>
        </tr>
        <tr>
          <td><code>systemctl enable &lt;srv&gt;</code></td>
          <td>Crea un enlace simbólico en <code>/etc/systemd/system/multi-user.target</code>.</td>
          <td>Asegurar que el servicio de rastreo inicie solo al prender la máquina.</td>
        </tr>
        <tr>
          <td><code>systemctl status &lt;srv&gt;</code></td>
          <td>Muestra el estado en vivo (PID, memoria, uso de CPU y logs recientes).</td>
          <td>Monitorear la salud operativa del daemon OpenSSH y la API del sistema.</td>
        </tr>
      </tbody>
    </table>
    <div class="table-note"><strong>Nota.</strong> Elaboración propia basada en la documentación oficial de Systemd (Poettering, 2023).</div>
  </div>

  <div class="page-break"></div>

  <!-- SECCIÓN 5: CONCLUSIONES Y VINCULACIÓN -->
  <h1>5. Conclusiones y Vinculación Socioformativa</h1>
  <p>
    La culminación exitosa de esta práctica de laboratorio consolida la base de infraestructura técnica requerida para la puesta en marcha integral del proyecto <strong>RUTABOL-SCZ</strong>. El aprovisionamiento de un servidor dedicado en Ubuntu Server garantiza la estabilidad necesaria para soportar la concurrencia de peticiones generadas por los paneles administrativos web de las líneas de microbuses y los dispositivos móviles de los conductores y estudiantes universitarios.
  </p>
  <p>
    Se evidenció la relevancia de adoptar buenas prácticas de ciberseguridad desde el inicio de la configuración: la creación de cuentas de trabajo especializadas (<code>operador</code>), la delimitación de directorios en <code>/srv/rutabol</code> y la restricción del acceso privilegiado mediante <code>sudo</code> conforman una defensa en profundidad que mitiga el riesgo de comprometer el sistema ante eventuales vulnerabilidades en las capas de aplicación.
  </p>
  <p>
    Asimismo, la actividad se encuentra estrechamente vinculada con los <strong>Objetivos de Desarrollo Sostenible (ODS)</strong> promovidos por las Naciones Unidas:
  </p>
  <ul style="margin-left: 2cm; margin-bottom: 14px; font-size: 11pt;">
    <li><strong>ODS 9 (Industria, Innovación e Infraestructura):</strong> Se impulsa el desarrollo de capacidades técnicas para modernizar la infraestructura de transporte público urbano en Santa Cruz de la Sierra mediante software libre, promoviendo sistemas de transporte resilientes, digitalizados e integrados.</li>
    <li><strong>ODS 4 (Educación de Calidad):</strong> Fomenta el aprendizaje autónomo, la resolución de problemas técnicos reales en entornos de virtualización (como el diagnóstico y resolución de errores de repositorios y desfases de reloj) y la asimilación de competencias prácticas de ingeniería de sistemas.</li>
  </ul>
  <p>
    La máquina virtualizada queda plenamente operativa, respaldada y configurada para continuar con las actividades formativas de despliegue de bases de datos, cortafuegos UFW y servidores web en las sesiones presenciales de la materia.
  </p>

  <!-- SECCIÓN 6: REFERENCIAS BIBLIOGRÁFICAS -->
  <h1 style="margin-top: 30px;">6. Referencias Bibliográficas (APA 7)</h1>
  
  <div class="reference-item">
    Canonical Ltd. (2024). <em>Ubuntu Server Guide: Network configuration and OpenSSH Server administration</em>. Canonical Documentation. https://ubuntu.com/server/docs
  </div>
  
  <div class="reference-item">
    Naciones Unidas. (2023). <em>Objetivos de Desarrollo Sostenible: Directrices del ODS 9 Industria, Innovación e Infraestructura</em>. Departamento de Asuntos Económicos y Sociales. https://sdgs.un.org/es/goals/goal9
  </div>

  <div class="reference-item">
    OpenBSD Project. (2024). <em>OpenSSH: The Secure Shell connectivity tools specification and manual pages</em>. OpenBSD Foundation. https://www.openssh.com
  </div>

  <div class="reference-item">
    Oracle Corporation. (2024). <em>Oracle VM VirtualBox®: User manual for release 7.0</em>. Oracle Cloud Infrastructure Documentation. https://www.virtualbox.org/manual
  </div>

  <div class="reference-item">
    Poettering, L. (2023). <em>systemd System and Service Manager: Unit management, dependencies and control commands</em>. Freedesktop.org. https://systemd.io
  </div>

  <div class="reference-item">
    Universidad Privada Domingo Savio. (2026). <em>Manual de laboratorio: Ubuntu Server y administración de servicios RUTABOL-SCZ</em>. Facultad de Ingeniería, Carrera de Ingeniería de Sistemas. Santa Cruz de la Sierra, Bolivia.
  </div>

</body>
</html>
`;

const tempHtmlPath = path.resolve('C:/Users/danie/OneDrive/Desktop/informe_temp.html');
const outputPdfPath = path.resolve('C:/Users/danie/OneDrive/Desktop/Frias_Daniel_UbuntuServer.pdf');

fs.writeFileSync(tempHtmlPath, htmlContent, 'utf-8');
console.log('✅ Archivo HTML generado exitosamente en:', tempHtmlPath);

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const command = `"${edgePath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${outputPdfPath}" "${tempHtmlPath}"`;

console.log('⏳ Renderizando PDF formal con Microsoft Edge...');
try {
  execSync(command);
  console.log('🎉 ¡PDF GENERADO CON ÉXITO!');
  console.log('📄 Ubicación del archivo:', outputPdfPath);
  
  if (fs.existsSync(outputPdfPath)) {
    const stats = fs.statSync(outputPdfPath);
    console.log(`📦 Tamaño del PDF: ${(stats.size / 1024).toFixed(1)} KB`);
  }
} catch (e) {
  console.error('Error al generar PDF:', e);
}
