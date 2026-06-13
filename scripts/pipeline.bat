@echo off
REM ============================================================
REM  3D 人体器官细胞漫游 — 全流程自动化脚本
REM ============================================================
REM  功能：串联 模型导出 → 优化 → 场景自检 → 视频渲染
REM  调用：scripts\pipeline.bat [选项]
REM    --skip-blender    跳过 Blender 导出
REM    --skip-meshlab    跳过 MeshLab 优化
REM    --skip-check      跳过场景自检
REM    --skip-video      跳过视频渲染
REM    --model <name>    指定渲染模型（如 heart）
REM    --help            显示帮助
REM ============================================================

setlocal enabledelayedexpansion

REM ============================================================
REM 路径配置
REM ============================================================
set "PROJECT_ROOT=%~dp0.."
set "LOG_DIR=%PROJECT_ROOT%\logs"
set "MODELS_DIR=%PROJECT_ROOT%\models"
set "PUBLIC_MODELS=%PROJECT_ROOT%\public\models"
set "RAW_DIR=%PROJECT_ROOT%\raw_model"
set "OPT_DIR=%PROJECT_ROOT%\optimized_model"
set "VIDEO_DIR=%PROJECT_ROOT%\remotion_video"
set "TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "LOG_FILE=%LOG_DIR%\pipeline_%TIMESTAMP%.log"

REM ============================================================
REM 参数解析
REM ============================================================
set "SKIP_BLENDER=0"
set "SKIP_MESHLAB=0"
set "SKIP_CHECK=0"
set "SKIP_VIDEO=0"
set "RENDER_MODEL=heart"

:parse_args
if "%~1"=="" goto after_args
if "%~1"=="--skip-blender" set "SKIP_BLENDER=1"
if "%~1"=="--skip-meshlab" set "SKIP_MESHLAB=1"
if "%~1"=="--skip-check" set "SKIP_CHECK=1"
if "%~1"=="--skip-video" set "SKIP_VIDEO=1"
if "%~1"=="--model" (
    set "RENDER_MODEL=%~2"
    shift
)
if "%~1"=="--help" goto show_help
shift
goto parse_args

:show_help
echo 用法: pipeline.bat [选项]
echo.
echo 选项:
echo   --skip-blender   跳过 Blender GLB 导出步骤
echo   --skip-meshlab   跳过 MeshLab 模型优化步骤
echo   --skip-check     跳过 3D 场景自检步骤
echo   --skip-video     跳过 Remotion 视频渲染步骤
echo   --model ^<name^>  指定渲染模型名称（默认 heart）
echo   --help           显示此帮助
echo.
echo 示例:
echo   pipeline.bat
echo   pipeline.bat --skip-blender --model brain
echo   pipeline.bat --skip-video
exit /b 0

:after_args

REM ============================================================
REM 初始化
REM ============================================================
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
echo ============================================================ > "%LOG_FILE%"
echo  3D 器官细胞漫游 — 全流程自动化 >> "%LOG_FILE%"
echo  运行时间: %date% %time% >> "%LOG_FILE%"
echo  渲染模型: %RENDER_MODEL% >> "%LOG_FILE%"
echo ============================================================ >> "%LOG_FILE%"

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║  3D 器官细胞漫游 - 全流程自动化        ║
echo  ╚══════════════════════════════════════════╝
echo.
echo  日志文件: %LOG_FILE%
echo  渲染模型: %RENDER_MODEL%
echo.

call :log "INFO" "开始全流程自动化"

REM ============================================================
REM 步骤 1：Blender 导出 GLB
REM ============================================================
if "%SKIP_BLENDER%"=="1" (
    call :log "SKIP" "跳过 Blender 导出"
    goto step2
)

call :print_step "1/5" "Blender 导出 GLB"
echo.

where blender >nul 2>&1
if %errorlevel% neq 0 (
    call :log "WARN" "未找到 Blender，跳过导出步骤"
    call :log "WARN" "请安装 Blender 3.6+ 并加入 PATH"
    goto step2
)

for %%f in ("%RAW_DIR%\*.blend") do (
    set "fname=%%~nxf"
    echo   处理: !fname!
    blender --background "%%f" --python "%PROJECT_ROOT%\scripts\blender_export_glb.py" >> "%LOG_FILE%" 2>&1
    if %errorlevel% neq 0 (
        call :log "ERROR" "Blender 导出失败: !fname!"
    ) else (
        call :log "OK"    "Blender 导出完成: !fname!"
    )
)

:step2

REM ============================================================
REM 步骤 2：MeshLab 模型优化
REM ============================================================
if "%SKIP_MESHLAB%"=="1" (
    call :log "SKIP" "跳过 MeshLab 优化"
    goto step3
)

call :print_step "2/5" "MeshLab 模型优化"
echo.

where meshlabserver >nul 2>&1
if %errorlevel% neq 0 (
    call :log "WARN" "未找到 meshlabserver，跳过优化步骤"
    call :log "WARN" "请安装 MeshLab 2022.02+ 并加入 PATH"
    goto step3
)

if not exist "%OPT_DIR%" mkdir "%OPT_DIR%"

for %%f in ("%RAW_DIR%\*.glb") do (
    set "fname=%%~nxf"
    echo   优化: !fname!
    meshlabserver -i "%%f" -o "%OPT_DIR%\!fname!" -s "%PROJECT_ROOT%\scripts\optimize_model.mlx" >> "%LOG_FILE%" 2>&1
    if %errorlevel% neq 0 (
        call :log "ERROR" "MeshLab 优化失败: !fname!"
    ) else (
        call :log "OK"    "MeshLab 优化完成: !fname!"
    )
)

:step3

REM ============================================================
REM 步骤 3：同步模型到项目目录
REM ============================================================
call :print_step "3/5" "同步模型文件"
echo.

REM 从 optimized_model 复制到 models/
if exist "%OPT_DIR%\*.glb" (
    if not exist "%MODELS_DIR%" mkdir "%MODELS_DIR%"
    xcopy /Y /Q "%OPT_DIR%\*.glb" "%MODELS_DIR%\" >> "%LOG_FILE%" 2>&1
    call :log "OK" "模型已同步到 models/"
) else (
    REM 如果 optimized 为空，从 raw_model 复制
    if exist "%RAW_DIR%\*.glb" (
        if not exist "%MODELS_DIR%" mkdir "%MODELS_DIR%"
        xcopy /Y /Q "%RAW_DIR%\*.glb" "%MODELS_DIR%\" >> "%LOG_FILE%" 2>&1
        call :log "OK" "模型已同步到 models/（来源：raw_model）"
    ) else (
        call :log "SKIP" "无 GLB 文件，跳过同步"
    )
)

REM 同步到 public/models（Vite 静态服务）
if not exist "%PUBLIC_MODELS%" mkdir "%PUBLIC_MODELS%"
if exist "%MODELS_DIR%\*.glb" (
    xcopy /Y /Q "%MODELS_DIR%\*.glb" "%PUBLIC_MODELS%\" >> "%LOG_FILE%" 2>&1
    call :log "OK" "模型已同步到 public/models/"
)

:step4

REM ============================================================
REM 步骤 4：场景自检
REM ============================================================
if "%SKIP_CHECK%"=="1" (
    call :log "SKIP" "跳过场景自检"
    goto step5
)

call :print_step "4/5" "3D 场景自检"
echo.

REM 检查 Node 依赖
if not exist "%PROJECT_ROOT%\node_modules" (
    echo   安装依赖...
    cd /d "%PROJECT_ROOT%"
    call npm install >> "%LOG_FILE%" 2>&1
    call :log "OK" "npm 依赖安装完成"
)

REM 检查关键文件
set "CHECK_FAIL=0"
for %%f in (
    "%PROJECT_ROOT%\src\App.tsx"
    "%PROJECT_ROOT%\src\RemotionScene.tsx"
    "%PROJECT_ROOT%\index.html"
    "%PROJECT_ROOT%\vite.config.ts"
) do (
    if not exist "%%f" (
        call :log "ERROR" "缺少文件: %%f"
        set "CHECK_FAIL=1"
    )
)

REM 检查 GLB 文件数量
set "GLB_COUNT=0"
for %%f in ("%PUBLIC_MODELS%\*.glb") do set /a GLB_COUNT+=1
if !GLB_COUNT! EQU 0 (
    call :log "WARN" "public/models/ 目录无 GLB 文件"
) else (
    call :log "OK" "发现 !GLB_COUNT! 个 GLB 模型文件"
)

if "!CHECK_FAIL!"=="1" (
    call :log "ERROR" "场景自检未通过"
    goto end
)

REM Vite 构建测试（快速验证）
echo   构建测试...
cd /d "%PROJECT_ROOT%"
call npx vite build --logLevel error >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    call :log "WARN" "Vite 构建有警告，查看日志"
) else (
    call :log "OK" "Vite 构建测试通过"
)

:step5

REM ============================================================
REM 步骤 5：Remotion 视频渲染
REM ============================================================
if "%SKIP_VIDEO%"=="1" (
    call :log "SKIP" "跳过视频渲染"
    goto end
)

call :print_step "5/5" "Remotion 视频渲染"
echo.

if not exist "%VIDEO_DIR%" mkdir "%VIDEO_DIR%"

set "COMPOSITION_ID=%RENDER_MODEL%-roam"
set "OUTPUT_FILE=%VIDEO_DIR%\%RENDER_MODEL%_%TIMESTAMP%.mp4"

echo   渲染 Composition: %COMPOSITION_ID%
echo   输出: %OUTPUT_FILE%

cd /d "%PROJECT_ROOT%"
call npx remotion render "%COMPOSITION_ID%" "%OUTPUT_FILE%" >> "%LOG_FILE%" 2>&1

if %errorlevel% neq 0 (
    call :log "ERROR" "视频渲染失败，查看 remotion_video/ 和日志"
) else (
    if exist "%OUTPUT_FILE%" (
        for %%A in ("%OUTPUT_FILE%") do set "FSIZE=%%~zA"
        set /a "FSIZE_MB=!FSIZE!/1048576"
        call :log "OK" "视频渲染完成: %RENDER_MODEL%.mp4 (!FSIZE_MB! MB)"
    )
)

:end

REM ============================================================
REM 汇总
REM ============================================================
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║  全流程完成                            ║
echo  ╚══════════════════════════════════════════╝
echo.
echo  日志: %LOG_FILE%
echo.
echo  产物:
echo    models/          - 优化后 GLB 模型
echo    remotion_video/  - 渲染视频
echo    dist/            - Web 预览构建
echo.

call :log "INFO" "全流程完成"
echo 全流程完成 >> "%LOG_FILE%"

pause
exit /b 0


REM ============================================================
REM 工具函数
REM ============================================================
:log
echo [%~1] %date% %time% - %~2
echo [%~1] %date% %time% - %~2 >> "%LOG_FILE%"
exit /b

:print_step
echo.
echo  ┌─────────────────────────────────────────┐
echo  │  [%~1] %~2
echo  └─────────────────────────────────────────┘
exit /b
