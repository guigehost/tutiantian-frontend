from fastapi import APIRouter
from . import auth, users, templates, datasources, projects, tasks, packages, orders, usage_logs

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(templates.router)
api_router.include_router(datasources.router)
api_router.include_router(projects.router)
api_router.include_router(tasks.router)
api_router.include_router(packages.router)
api_router.include_router(orders.router)
api_router.include_router(usage_logs.router)
