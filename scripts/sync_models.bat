@echo off
REM ============================================================
REM  模型文件同步脚本
REM  将 models/ 中的 GLB 同步到 public/models/（Vite 静态服务）
REM ============================================================
setlocal

set "PROJECT_ROOT=%~dp0.."
set "SRC=%PROJECT_ROOT%\models"
set "DST=%PROJECT_ROOT%\public\models"

if not exist "%SRC%" (
    echo [WARN] models/ 目录不存在
    exit /b 1
)

if not exist "%DST%" mkdir "%DST%"

set "COUNT=0"
for %%f in ("%SRC%\*.glb") do (
    set /a COUNT+=1
    echo [COPY] %%~nxf
    copy /Y "%%f" "%DST%\" >nul
)

echo.
echo 同步完成: %COUNT% 个模型文件
echo   models/        → public/models/
