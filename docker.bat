@echo off
REM Docker Helper Script for E-commerce Microservices (Windows)
REM Usage: docker.bat [command] [service]

setlocal enabledelayedexpansion

set COMPOSE_DEV=docker-compose.dev.yml
set COMPOSE_PROD=docker-compose.prod.yml
set ENV_FILE=.env

REM Functions
:print_header
echo ========================================
echo %~1
echo ========================================
echo.
goto :eof

:print_error
echo [ERROR] %~1
goto :eof

:check_env_file
if not exist "%ENV_FILE%" (
    call :print_error ".env file not found!"
    echo Creating .env from .env.example...
    copy .env.example .env
    echo [WARNING] Please update .env with your values
    exit /b 1
)
goto :eof

REM Commands
:dev_up
call :print_header "Starting Development Environment"
call :check_env_file
docker-compose -f %COMPOSE_DEV% up -d
echo [OK] Development environment started
docker-compose -f %COMPOSE_DEV% ps
goto :eof

:dev_down
call :print_header "Stopping Development Environment"
docker-compose -f %COMPOSE_DEV% down
echo [OK] Development environment stopped
goto :eof

:dev_logs
if "%~2"=="" (
    docker-compose -f %COMPOSE_DEV% logs -f
) else (
    docker-compose -f %COMPOSE_DEV% logs -f %~2
)
goto :eof

:dev_restart
if "%~2"=="" (
    call :print_error "Please specify a service"
    exit /b 1
)
call :print_header "Restarting %~2"
docker-compose -f %COMPOSE_DEV% restart %~2
echo [OK] %~2 restarted
goto :eof

:dev_rebuild
call :print_header "Rebuilding"
call :check_env_file
if "%~2"=="" (
    docker-compose -f %COMPOSE_DEV% up -d --build
) else (
    docker-compose -f %COMPOSE_DEV% up -d --build %~2
)
echo [OK] Build complete
goto :eof

:prod_up
call :print_header "Starting Production Environment"
call :check_env_file
docker-compose -f %COMPOSE_PROD% up -d
echo [OK] Production environment started
goto :eof

:prod_down
call :print_header "Stopping Production Environment"
docker-compose -f %COMPOSE_PROD% down
echo [OK] Production environment stopped
goto :eof

:prod_build
call :print_header "Building Production Images"
docker-compose -f %COMPOSE_PROD% build
echo [OK] Production images built
goto :eof

:show_ps
docker-compose -f %COMPOSE_DEV% ps
goto :eof

:exec_shell
if "%~2"=="" (
    call :print_error "Please specify a service"
    exit /b 1
)
docker-compose -f %COMPOSE_DEV% exec %~2 sh
goto :eof

:db_connect
call :print_header "Connecting to PostgreSQL"
docker-compose -f %COMPOSE_DEV% exec postgres psql -U postgres
goto :eof

:redis_connect
call :print_header "Connecting to Redis"
docker-compose -f %COMPOSE_DEV% exec redis redis-cli
goto :eof

:show_stats
call :print_header "Container Stats"
docker stats
goto :eof

:show_urls
call :print_header "Service URLs"
echo API Gateway:       http://localhost:8080
echo Auth Service:      http://localhost:3001
echo Product Service:   http://localhost:3002
echo Order Service:     http://localhost:3003
echo Payment Service:   http://localhost:3004
echo Inventory Service: http://localhost:3005
echo Notification:      http://localhost:3006
echo.
echo RabbitMQ Management: http://localhost:15672 (guest/guest)
goto :eof

:show_help
echo Docker Helper Script for E-commerce Microservices (Windows)
echo.
echo Usage: docker.bat [command] [service]
echo.
echo Development Commands:
echo   dev:up           Start development environment
echo   dev:down         Stop development environment
echo   dev:logs [svc]   Show logs (all or specific service)
echo   dev:restart svc  Restart specific service
echo   dev:rebuild svc  Rebuild service with hot reload
echo.
echo Production Commands:
echo   prod:up          Start production environment
echo   prod:down        Stop production environment
echo   prod:build       Build production images
echo.
echo Utility Commands:
echo   ps               Show running containers
echo   exec svc         Execute shell in service
echo   db:connect       Connect to PostgreSQL
echo   redis:connect    Connect to Redis
echo   stats            Show container statistics
echo   urls             Show service URLs
echo   help             Show this help message
echo.
echo Examples:
echo   docker.bat dev:up
echo   docker.bat dev:logs auth-service
echo   docker.bat exec auth-service
echo   docker.bat db:connect
echo.
goto :eof

REM Main script logic
if "%~1"=="dev:up" call :dev_up
if "%~1"=="dev:down" call :dev_down
if "%~1"=="dev:logs" call :dev_logs %~2
if "%~1"=="dev:restart" call :dev_restart %~2
if "%~1"=="dev:rebuild" call :dev_rebuild %~2
if "%~1"=="prod:up" call :prod_up
if "%~1"=="prod:down" call :prod_down
if "%~1"=="prod:build" call :prod_build
if "%~1"=="ps" call :show_ps
if "%~1"=="exec" call :exec_shell %~2
if "%~1"=="db:connect" call :db_connect
if "%~1"=="redis:connect" call :redis_connect
if "%~1"=="stats" call :show_stats
if "%~1"=="urls" call :show_urls
if "%~1"=="help" call :show_help
if "%~1"=="" call :show_help
if not "%~1"=="dev:up" if not "%~1"=="dev:down" if not "%~1"=="dev:logs" if not "%~1"=="dev:restart" if not "%~1"=="dev:rebuild" if not "%~1"=="prod:up" if not "%~1"=="prod:down" if not "%~1"=="prod:build" if not "%~1"=="ps" if not "%~1"=="exec" if not "%~1"=="db:connect" if not "%~1"=="redis:connect" if not "%~1"=="stats" if not "%~1"=="urls" if not "%~1"=="help" if not "%~1"=="" (
    call :print_error "Unknown command: %~1"
    call :show_help
    exit /b 1
)
