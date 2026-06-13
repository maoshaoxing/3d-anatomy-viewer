@echo off
REM ============================================================
REM  MeshLab 批量模型优化脚本
REM  用途：依次处理 raw_model 中所有 GLB，输出到 optimized_model
REM  调用：双击运行或在命令行执行
REM  依赖：MeshLab 2022.02+ 已安装，meshlabserver 在 PATH 中
REM ============================================================

setlocal enabledelayedexpansion

set "RAW_DIR=D:\3D人体器官细胞漫游项目\raw_model"
set "OPT_DIR=D:\3D人体器官细胞漫游项目\optimized_model"
set "MLX_SCRIPT=D:\3D人体器官细胞漫游项目\scripts\optimize_model.mlx"
set "LOG_FILE=D:\3D人体器官细胞漫游项目\logs\meshlab_optimize.log"

REM 如果 D 盘不可用，回退到工作区路径（开发环境自动适配）
if not exist "%RAW_DIR%" (
    set "RAW_DIR=%~dp0..\raw_model"
    set "OPT_DIR=%~dp0..\optimized_model"
    set "MLX_SCRIPT=%~dp0optimize_model.mlx"
    set "LOG_FILE=%~dp0..\logs\meshlab_optimize.log"
)

REM 创建日志目录
if not exist "%~dp0..\logs" mkdir "%~dp0..\logs"

REM 清空上次日志
echo MeshLab 优化日志 - %date% %time% > "%LOG_FILE%"
echo ============================================================ >> "%LOG_FILE%"

REM 检查 source 目录
if not exist "%RAW_DIR%" (
    echo [ERROR] 源目录不存在: %RAW_DIR%
    echo [ERROR] 源目录不存在 >> "%LOG_FILE%"
    pause
    exit /b 1
)

REM 创建输出目录
if not exist "%OPT_DIR%" mkdir "%OPT_DIR%"

REM 检查 meshlabserver
where meshlabserver >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] 未找到 meshlabserver，请确认 MeshLab 已安装并加入 PATH
    echo [ERROR] meshlabserver not found >> "%LOG_FILE%"
    pause
    exit /b 1
)

set "SUCCESS=0"
set "FAIL=0"

for %%f in ("%RAW_DIR%\*.glb") do (
    set "filename=%%~nf"
    set "input=%%f"
    set "output=%OPT_DIR%\%%~nf.glb"

    echo 处理: !filename!.glb ...

    meshlabserver -i "!input!" -o "!output!" -s "%MLX_SCRIPT%" -om vc vn fc fn wt 2>> "%LOG_FILE%"

    if exist "!output!" (
        echo   [OK] → optimized_model\!filename!.glb
        echo [OK] !filename!.glb >> "%LOG_FILE%"
        set /a SUCCESS+=1
    ) else (
        echo   [FAIL] 优化失败
        echo [FAIL] !filename!.glb >> "%LOG_FILE%"
        set /a FAIL+=1
    )
)

echo.
echo ============================================================
echo  完成：成功 !SUCCESS!，失败 !FAIL!
echo ============================================================
echo 完成：成功 !SUCCESS!，失败 !FAIL! >> "%LOG_FILE%"

pause
