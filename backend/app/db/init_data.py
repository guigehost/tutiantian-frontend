from app.db.database import SessionLocal
from app.models.package import Package

def init_packages():
    db = SessionLocal()

    # 检查是否已有数据
    if db.query(Package).count() > 0:
        db.close()
        return

    # 限时优惠套餐（原价2毛/次，折扣价）
    # 10元/100次 = 原价20元 -> 5折
    # 50元/1000次 = 原价200元 -> 2.5折
    # 100元/3000次 = 原价600元 -> 约1.7折
    packages = [
        Package(
            name="基础套餐",
            billing_type="quota",
            quota=100,
            price=10,
            max_templates=5,
            max_file_size=10485760,
            is_featured=False,
            sort_order=100,
            description="限时5折优惠"
        ),
        Package(
            name="超值套餐",
            billing_type="quota",
            quota=1000,
            price=50,
            max_templates=20,
            max_file_size=31457280,
            is_featured=True,
            sort_order=90,
            description="限时2.5折优惠"
        ),
        Package(
            name="至尊套餐",
            billing_type="quota",
            quota=3000,
            price=100,
            max_templates=-1,
            max_file_size=104857600,
            is_featured=False,
            sort_order=80,
            description="限时1.7折优惠"
        ),
    ]

    for p in packages:
        db.add(p)

    db.commit()
    db.close()

if __name__ == "__main__":
    init_packages()
